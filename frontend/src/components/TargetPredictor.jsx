import React, { useState } from "react";
import {
  Target,
  ChevronRight,
  Calculator,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BookOpen,
  Cpu,
  Layers,
  Check,
} from "lucide-react";
import { motion } from "framer-motion";

const GRADES = [
  { grade: "O", min: 90, label: "Outstanding (10 Pts)", color: "#b45309", bg: "#fef3c7", border: "#fde68a" },
  { grade: "E", min: 80, label: "Excellent (9 Pts)", color: "#15803d", bg: "#dcfce7", border: "#bbf7d0" },
  { grade: "A", min: 70, label: "Very Good (8 Pts)", color: "#1d4ed8", bg: "#dbeafe", border: "#bfdbfe" },
  { grade: "B", min: 60, label: "Good (7 Pts)", color: "#7e22ce", bg: "#f3e8ff", border: "#e9d5ff" },
  { grade: "C", min: 50, label: "Fair (6 Pts)", color: "#c2410c", bg: "#ffedd5", border: "#fed7aa" },
  { grade: "D", min: 40, label: "Pass (5 Pts)", color: "#475569", bg: "#f1f5f9", border: "#cbd5e1" },
];

export default function TargetPredictor() {
  const [subjectType, setSubjectType] = useState("theory"); // theory, practice, project
  const [internalMarks, setInternalMarks] = useState("");
  const [isMobile, setIsMobile] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 768 : false));

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxInternal = subjectType === "theory" ? 40 : 50;
  const maxExternal = subjectType === "theory" ? 60 : 50;

  const currentInternal = Number(internalMarks);
  const isValidInternal =
    internalMarks !== "" &&
    !isNaN(currentInternal) &&
    currentInternal >= 0 &&
    currentInternal <= maxInternal;

  const presets = subjectType === "theory" ? [25, 30, 34, 38, 40] : [30, 35, 40, 45, 50];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 20 }}>
      {/* Main Form Container Card */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: 16,
          padding: isMobile ? "14px 14px" : "24px 26px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 14px rgba(15, 23, 42, 0.03)",
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? 14 : 22,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: isMobile ? 36 : 44,
              height: isMobile ? 36 : 44,
              borderRadius: 10,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Calculator size={isMobile ? 18 : 22} />
          </div>
          <div>
            <h3 style={{ fontSize: isMobile ? 15 : 17, fontWeight: 800, color: "#0f172a", margin: "0 0 2px 0" }}>
              End-Semester Grade & Target Predictor
            </h3>
            <p style={{ color: "#64748b", fontSize: isMobile ? 11.5 : 13, margin: 0 }}>
              Enter internal marks to calculate the exact external score needed for each grade
            </p>
          </div>
        </div>

        {/* 1. Subject Type Selection */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: isMobile ? 10.5 : 11.5,
              fontWeight: 800,
              color: "#475569",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            1. Select Course Assessment Model
          </label>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
            {[
              { id: "theory", label: "Theory Course", sub: "40 Internal + 60 External", icon: <BookOpen size={16} /> },
              { id: "practice", label: "Practice / Lab", sub: "50 Internal + 50 External", icon: <Cpu size={16} /> },
              { id: "project", label: "Project Work", sub: "50 Internal + 50 External", icon: <Layers size={16} /> },
            ].map((type) => {
              const isSelected = subjectType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => {
                    setSubjectType(type.id);
                    setInternalMarks("");
                  }}
                  style={{
                    padding: isMobile ? "10px 12px" : "14px 16px",
                    background: isSelected ? "#eff6ff" : "#ffffff",
                    border: isSelected ? "2px solid #2563eb" : "1px solid #cbd5e1",
                    borderRadius: 12,
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    transition: "all 0.15s ease",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <div
                    style={{
                      color: isSelected ? "#2563eb" : "#64748b",
                      flexShrink: 0,
                    }}
                  >
                    {type.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: isMobile ? 12.5 : 13.5, fontWeight: 800, color: isSelected ? "#1d4ed8" : "#0f172a" }}>
                      {type.label}
                    </div>
                    <div style={{ fontSize: isMobile ? 10.5 : 11.5, color: isSelected ? "#2563eb" : "#64748b", marginTop: 1, fontWeight: 500 }}>
                      {type.sub}
                    </div>
                  </div>
                  {isSelected && (
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "#2563eb",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Check size={11} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Internal Marks Input & Presets */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: 11.5,
              fontWeight: 800,
              color: "#475569",
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            2. Enter Your Internal Score (Out of {maxInternal})
          </label>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ position: "relative", maxWidth: 360 }}>
              <input
                type="number"
                value={internalMarks}
                onChange={(e) => setInternalMarks(e.target.value)}
                placeholder={`e.g. ${subjectType === "theory" ? "34" : "42"}`}
                min="0"
                max={maxInternal}
                step="0.5"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px 60px 12px 16px",
                  background: "#ffffff",
                  border:
                    internalMarks !== "" && !isValidInternal
                      ? "1.5px solid #ef4444"
                      : "1.5px solid #cbd5e1",
                  borderRadius: 10,
                  color: "#0f172a",
                  fontSize: 16,
                  fontWeight: 800,
                  fontFamily: "'Space Mono', monospace",
                  outline: "none",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                onBlur={(e) => {
                  if (internalMarks === "" || isValidInternal) e.target.style.borderColor = "#cbd5e1";
                }}
              />
              <span
                style={{
                  position: "absolute",
                  right: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#64748b",
                  fontFamily: "'Space Mono', monospace",
                  pointerEvents: "none",
                }}
              >
                / {maxInternal}
              </span>
            </div>

            {/* Quick Presets */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Quick Presets:</span>
              {presets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setInternalMarks(String(val))}
                  style={{
                    padding: "3px 10px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    background: internalMarks === String(val) ? "#eff6ff" : "#f8fafc",
                    color: internalMarks === String(val) ? "#2563eb" : "#334155",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "'Space Mono', monospace",
                    transition: "all 0.1s ease",
                  }}
                >
                  {val}
                </button>
              ))}
            </div>

            {internalMarks !== "" && !isValidInternal && (
              <p style={{ color: "#dc2626", fontSize: 12.5, margin: "4px 0 0 0", display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={14} /> Please enter a valid internal score between 0 and {maxInternal}.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Grade Prediction Results Grid */}
      {isValidInternal ? (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: 16,
            padding: isMobile ? "14px 14px" : "24px 26px",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 14px rgba(15, 23, 42, 0.03)",
            display: "flex",
            flexDirection: "column",
            gap: isMobile ? 12 : 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div>
              <h4 style={{ fontSize: isMobile ? 14 : 15, fontWeight: 800, color: "#0f172a", margin: "0 0 2px 0" }}>
                Target External Scores (Out of {maxExternal})
              </h4>
              <p style={{ color: "#64748b", fontSize: isMobile ? 11.5 : 12.5, margin: 0 }}>
                Based on your internal mark of <strong>{currentInternal} / {maxInternal}</strong>
              </p>
            </div>
            <span style={{ fontSize: isMobile ? 11 : 12, fontWeight: 700, color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "2px 8px", borderRadius: 20 }}>
              Live Target Projection
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))",
              gap: isMobile ? 10 : 14,
            }}
          >
            {GRADES.map((g, i) => {
              const required = g.min - currentInternal;
              const isPossible = required <= maxExternal;
              const isGuaranteed = required <= 0;
              const externalNeeded = Math.max(0, required);
              const percentageNeeded = Math.round((externalNeeded / maxExternal) * 100);

              let statusBadge = null;
              let cardBorder = "#cbd5e1";
              let cardBg = "#ffffff";

              if (isGuaranteed) {
                cardBorder = "#bbf7d0";
                cardBg = "#f0fdf4";
                statusBadge = {
                  label: "Guaranteed",
                  icon: <CheckCircle size={13} />,
                  color: "#15803d",
                  bg: "#dcfce7",
                };
              } else if (!isPossible) {
                cardBorder = "#fecaca";
                cardBg = "#fef2f2";
                statusBadge = {
                  label: "Out of Reach",
                  icon: <XCircle size={13} />,
                  color: "#b91c1c",
                  bg: "#fee2e2",
                };
              } else if (required <= maxExternal * 0.5) {
                cardBorder = "#bfdbfe";
                statusBadge = {
                  label: "Achievable",
                  icon: <CheckCircle size={13} />,
                  color: "#1d4ed8",
                  bg: "#dbeafe",
                };
              } else if (required <= maxExternal * 0.8) {
                cardBorder = "#fed7aa";
                statusBadge = {
                  label: "Moderate",
                  icon: <Target size={13} />,
                  color: "#c2410c",
                  bg: "#ffedd5",
                };
              } else {
                cardBorder = "#fde68a";
                statusBadge = {
                  label: "Challenging",
                  icon: <AlertTriangle size={13} />,
                  color: "#b45309",
                  bg: "#fef3c7",
                };
              }

              return (
                <div
                  key={g.grade}
                  style={{
                    background: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: 14,
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 12,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                  }}
                >
                  {/* Grade Badge Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          background: g.bg,
                          border: `1px solid ${g.border}`,
                          color: g.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                          fontWeight: 800,
                          fontFamily: "'Space Mono', monospace",
                        }}
                      >
                        {g.grade}
                      </span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                          Grade {g.grade}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                          ≥ {g.min}% Overall
                        </div>
                      </div>
                    </div>

                    {statusBadge && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: statusBadge.color,
                          background: statusBadge.bg,
                          padding: "2px 7px",
                          borderRadius: 6,
                        }}
                      >
                        {statusBadge.icon} {statusBadge.label}
                      </span>
                    )}
                  </div>

                  {/* Required Target Score */}
                  <div>
                    {isGuaranteed ? (
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#15803d" }}>
                        Already secured from internal!
                      </div>
                    ) : !isPossible ? (
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#b91c1c" }}>
                        Needs {required} (Exceeds max {maxExternal})
                      </div>
                    ) : (
                      <div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                          <span
                            style={{
                              fontSize: 22,
                              fontWeight: 800,
                              color: "#0f172a",
                              fontFamily: "'Space Mono', monospace",
                            }}
                          >
                            {externalNeeded}
                          </span>
                          <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>
                            / {maxExternal} External
                          </span>
                        </div>

                        {/* Visual Progress Meter */}
                        <div
                          style={{
                            width: "100%",
                            height: 6,
                            background: "#e2e8f0",
                            borderRadius: 4,
                            overflow: "hidden",
                            marginTop: 8,
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              background:
                                percentageNeeded > 80
                                  ? "#f59e0b"
                                  : percentageNeeded > 50
                                  ? "#2563eb"
                                  : "#10b981",
                              width: `${percentageNeeded}%`,
                              borderRadius: 4,
                            }}
                          />
                        </div>
                        <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 4, fontWeight: 600, textAlign: "right" }}>
                          Need {percentageNeeded}% on final exam
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "#ffffff",
            border: "1px dashed #cbd5e1",
            borderRadius: 16,
            padding: "36px 24px",
            textAlign: "center",
            color: "#64748b",
          }}
        >
          <Target size={36} color="#94a3b8" style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>
            Enter your internal score above
          </div>
          <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 4 }}>
            The system will calculate the exact target scores required for grades O through D.
          </div>
        </div>
      )}
    </div>
  );
}
