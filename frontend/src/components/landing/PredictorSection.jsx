import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Target,
  Calculator,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

const GRADES_RUBRIC = [
  { grade: "O", min: 90, label: "Outstanding (10 Pts)", color: "#b45309", bg: "#fef3c7" },
  { grade: "E", min: 80, label: "Excellent (9 Pts)", color: "#15803d", bg: "#dcfce7" },
  { grade: "A", min: 70, label: "Very Good (8 Pts)", color: "#1d4ed8", bg: "#dbeafe" },
  { grade: "B", min: 60, label: "Good (7 Pts)", color: "#7e22ce", bg: "#f3e8ff" },
];

export default function PredictorSection({ onOpenPredictorTool }) {
  const [activeMode, setActiveMode] = useState("cgpa");

  // CGPA Predictor State
  const [currentCgpa, setCurrentCgpa] = useState(8.21);
  const [completedSems, setCompletedSems] = useState(5);
  const [targetCgpa, setTargetCgpa] = useState(8.5);
  const totalSems = 8;
  const remainingSems = totalSems - completedSems;

  const currentTotalPoints = currentCgpa * completedSems;
  const targetTotalPoints = targetCgpa * totalSems;
  const requiredRemainingPoints = targetTotalPoints - currentTotalPoints;
  const requiredAvgSgpa = remainingSems > 0 ? requiredRemainingPoints / remainingSems : 0;
  const isAchievable = requiredAvgSgpa <= 10.0 && requiredAvgSgpa >= 0;

  // External Exam Predictor State
  const [subjectType, setSubjectType] = useState("theory");
  const [internalMarks, setInternalMarks] = useState(34);
  const maxInternal = subjectType === "theory" ? 40 : 50;
  const maxExternal = subjectType === "theory" ? 60 : 50;

  return (
    <section
      id="predictor"
      className="gf-landing-section"
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "80px 24px",
        overflowX: "hidden",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          gap: 28,
          alignItems: "start",
          width: "100%",
          boxSizing: "border-box",
        }}
        className="gf-editorial-split"
      >
        {/* Left Column: Narrative & Interactive Controls */}
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              color: "#d97706",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            <Calculator size={15} strokeWidth={2.4} />
            <span>What-If Simulation Lab</span>
          </div>

          <h2
            style={{
              fontSize: "clamp(28px, 3.8vw, 42px)",
              fontWeight: 850,
              lineHeight: 1.12,
              letterSpacing: "-0.03em",
              color: "#0f172a",
              margin: "0 0 16px 0",
            }}
          >
            Don't wait for results to know what's possible
          </h2>

          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: "#64748b",
              margin: "0 0 28px 0",
            }}
          >
            Run real-time what-if simulations to calculate the exact average SGPA needed to reach graduation honors, or determine required external exam scores before finals.
          </p>

          {/* Mode Switcher */}
          <div
            style={{
              display: "inline-flex",
              background: "#f1f5f9",
              padding: 4,
              borderRadius: 10,
              gap: 4,
              marginBottom: 28,
            }}
          >
            <button
              onClick={() => setActiveMode("cgpa")}
              style={{
                padding: "8px 18px",
                borderRadius: 7,
                fontSize: 13,
                fontWeight: activeMode === "cgpa" ? 750 : 600,
                background: activeMode === "cgpa" ? "#ffffff" : "transparent",
                color: activeMode === "cgpa" ? "#0f172a" : "#64748b",
                border: "none",
                cursor: "pointer",
                boxShadow: activeMode === "cgpa" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              Target CGPA Simulator
            </button>
            <button
              onClick={() => setActiveMode("external")}
              style={{
                padding: "8px 18px",
                borderRadius: 7,
                fontSize: 13,
                fontWeight: activeMode === "external" ? 750 : 600,
                background: activeMode === "external" ? "#ffffff" : "transparent",
                color: activeMode === "external" ? "#0f172a" : "#64748b",
                border: "none",
                cursor: "pointer",
                boxShadow: activeMode === "external" ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              Exam Marks Required
            </button>
          </div>

          {activeMode === "cgpa" ? (
            /* Mode 1 Controls */
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 650, color: "#334155", marginBottom: 8 }}>
                  <span>Current CGPA Standing</span>
                  <span style={{ color: "#2563eb", fontFamily: "'Space Mono', monospace" }}>{currentCgpa.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="6.0"
                  max="10.0"
                  step="0.05"
                  value={currentCgpa}
                  onChange={(e) => setCurrentCgpa(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "#2563eb", height: 6 }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 650, color: "#334155", marginBottom: 8 }}>
                  <span>Target Graduation CGPA Goal</span>
                  <span style={{ color: "#d97706", fontFamily: "'Space Mono', monospace" }}>{targetCgpa.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="6.5"
                  max="10.0"
                  step="0.05"
                  value={targetCgpa}
                  onChange={(e) => setTargetCgpa(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "#d97706", height: 6 }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 650, color: "#334155", marginBottom: 8 }}>
                  <span>Completed Semesters</span>
                  <span style={{ color: "#0f172a", fontFamily: "'Space Mono', monospace" }}>{completedSems} of 8 Sems</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[1, 2, 3, 4, 5, 6, 7].map((sem) => (
                    <button
                      key={sem}
                      onClick={() => setCompletedSems(sem)}
                      style={{
                        flex: 1,
                        padding: "6px 0",
                        borderRadius: 6,
                        border: "1px solid",
                        borderColor: completedSems === sem ? "#2563eb" : "#e2e8f0",
                        background: completedSems === sem ? "#eff6ff" : "#ffffff",
                        color: completedSems === sem ? "#1d4ed8" : "#64748b",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {sem}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Mode 2 Controls */
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 650, color: "#334155", marginBottom: 8 }}>
                  <span>Your Internal Assessment Marks</span>
                  <span style={{ color: "#059669", fontFamily: "'Space Mono', monospace" }}>
                    {internalMarks} / {maxInternal}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxInternal}
                  step="1"
                  value={internalMarks}
                  onChange={(e) => setInternalMarks(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: "#059669", height: 6 }}
                />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => {
                    setSubjectType("theory");
                    if (internalMarks > 40) setInternalMarks(34);
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: subjectType === "theory" ? 750 : 600,
                    background: subjectType === "theory" ? "#ecfdf5" : "#f8fafc",
                    color: subjectType === "theory" ? "#065f46" : "#64748b",
                    border: subjectType === "theory" ? "1px solid #a7f3d0" : "1px solid #e2e8f0",
                    cursor: "pointer",
                  }}
                >
                  Theory Course (40 Int + 60 Ext)
                </button>
                <button
                  onClick={() => setSubjectType("practice")}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: subjectType === "practice" ? 750 : 600,
                    background: subjectType === "practice" ? "#ecfdf5" : "#f8fafc",
                    color: subjectType === "practice" ? "#065f46" : "#64748b",
                    border: subjectType === "practice" ? "1px solid #a7f3d0" : "1px solid #e2e8f0",
                    cursor: "pointer",
                  }}
                >
                  Practice Course (50 Int + 50 Ext)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Dynamic Simulation Result Stage */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid #f1f5f9",
            boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
            padding: "32px",
          }}
        >
          {activeMode === "cgpa" ? (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", marginBottom: 16 }}>
                Simulated Output Analysis
              </div>

              <div
                style={{
                  background: isAchievable ? "#fffbeb" : "#fef2f2",
                  border: isAchievable ? "1px solid #fde68a" : "1px solid #fecaca",
                  borderRadius: 12,
                  padding: "20px",
                  marginBottom: 20,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 650, color: isAchievable ? "#92400e" : "#991b1b", marginBottom: 4 }}>
                  Required Average Performance
                </div>
                <div style={{ fontSize: 32, fontWeight: 850, color: isAchievable ? "#b45309" : "#dc2626", fontFamily: "'Space Mono', monospace", lineHeight: 1.1 }}>
                  {isAchievable ? `${requiredAvgSgpa.toFixed(2)} SGPA` : "Target Not Feasible"}
                </div>
                <div style={{ fontSize: 12.5, color: isAchievable ? "#78350f" : "#b91c1c", marginTop: 8 }}>
                  {isAchievable
                    ? `Maintain ${requiredAvgSgpa.toFixed(2)} SGPA across the remaining ${remainingSems} semesters to reach ${targetCgpa.toFixed(2)} CGPA.`
                    : `Mathematically unattainable even with a 10.0 SGPA in the remaining ${remainingSems} semesters.`}
                </div>
              </div>

              {/* Breakdown Metric Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13 }}>
                <div style={{ padding: "12px", background: "#f8fafc", borderRadius: 8 }}>
                  <div style={{ color: "#64748b", fontSize: 11.5 }}>Current Points Earned</div>
                  <div style={{ fontWeight: 750, color: "#0f172a", marginTop: 2 }}>{currentTotalPoints.toFixed(1)} / {totalSems * 10}</div>
                </div>
                <div style={{ padding: "12px", background: "#f8fafc", borderRadius: 8 }}>
                  <div style={{ color: "#64748b", fontSize: 11.5 }}>Remaining Semesters</div>
                  <div style={{ fontWeight: 750, color: "#2563eb", marginTop: 2 }}>{remainingSems} Semesters Left</div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", marginBottom: 16 }}>
                External Marks Required per Grade
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {GRADES_RUBRIC.map((item) => {
                  const needed = item.min - internalMarks;
                  const canGet = needed <= maxExternal;
                  return (
                    <div
                      key={item.grade}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        background: "#f8fafc",
                        borderRadius: 8,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: item.bg,
                            color: item.color,
                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          {item.grade}
                        </span>
                        <span style={{ fontSize: 13, color: "#334155", fontWeight: 600 }}>{item.label}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 750, color: canGet ? "#0f172a" : "#dc2626", fontFamily: "'Space Mono', monospace" }}>
                        {needed <= 0 ? "Already Secured" : canGet ? `${needed} / ${maxExternal} marks` : "Not Possible"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Direct Analytics Goal Predictor Handoff */}
          <div
            onClick={onOpenPredictorTool}
            style={{
              marginTop: 20,
              padding: "12px 16px",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fef3c7";
              e.currentTarget.style.borderColor = "#f59e0b";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fffbeb";
              e.currentTarget.style.borderColor = "#fde68a";
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 750, color: "#92400e", lineHeight: 1.3 }}>
                Calculate with your verified academic records
              </div>
              <div style={{ fontSize: 11.5, color: "#b45309", marginTop: 2 }}>
                Open your real-time CGPA Goal Predictor in Analytics
              </div>
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12.5,
                fontWeight: 750,
                color: "#b45309",
                flexShrink: 0,
              }}
            >
              <span>Open Predictor</span>
              <ChevronRight size={15} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
