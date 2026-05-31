import React, { useState } from "react";
import { Target, ChevronRight, Calculator, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

const GRADES = [
  { grade: 'O', min: 90 },
  { grade: 'E', min: 80 },
  { grade: 'A', min: 70 },
  { grade: 'B', min: 60 },
  { grade: 'C', min: 50 },
  { grade: 'D', min: 40 },
];

export default function TargetPredictor() {
  const [subjectType, setSubjectType] = useState("theory"); // theory, practice, project
  const [internalMarks, setInternalMarks] = useState("");

  const maxInternal = subjectType === "theory" ? 40 : 50;
  const maxExternal = subjectType === "theory" ? 60 : 50;

  const currentInternal = Number(internalMarks);
  const isValidInternal = internalMarks !== "" && !isNaN(currentInternal) && currentInternal >= 0 && currentInternal <= maxInternal;

  return (
    <div style={{ padding: "20px 0" }}>
      <div style={{ background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: 16, overflow: "hidden" }}>
        
        {/* Header */}
        <div style={{ background: "rgba(62,166,255,0.05)", padding: 20, borderBottom: "1px solid var(--border-color)" }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 10 }}>
            <Calculator size={20} color="var(--accent)" />
            End-Sem Target Predictor
          </h3>
          <p style={{ color: "var(--secondary)", fontSize: 13, marginTop: 5 }}>
            Enter your internal marks to predict exactly what you need to score on the final exam to secure a specific grade.
          </p>
        </div>

        {/* Inputs */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Subject Type
            </label>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                { id: "theory", label: "Theory (40/60)" },
                { id: "practice", label: "Practice (50/50)" },
                { id: "project", label: "Project (50/50)" },
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => { setSubjectType(type.id); setInternalMarks(""); }}
                  style={{
                    flex: "1 1 120px",
                    padding: "12px 16px",
                    background: subjectType === type.id ? "var(--accent)" : "transparent",
                    color: subjectType === type.id ? "#fff" : "var(--text-main)",
                    border: `1px solid ${subjectType === type.id ? "var(--accent)" : "var(--border-color)"}`,
                    borderRadius: 10,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Your Internal Marks (out of {maxInternal})
            </label>
            <input
              type="number"
              value={internalMarks}
              onChange={(e) => setInternalMarks(e.target.value)}
              placeholder={`Enter marks (0 - ${maxInternal})`}
              style={{
                width: "100%",
                maxWidth: 400,
                padding: "14px 16px",
                background: "var(--bg-main)",
                border: `1px solid ${internalMarks !== "" && !isValidInternal ? "var(--danger)" : "var(--border-color)"}`,
                borderRadius: 10,
                color: "var(--text-main)",
                fontSize: 16,
                fontWeight: 600,
                outline: "none"
              }}
            />
            {internalMarks !== "" && !isValidInternal && (
              <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                <AlertTriangle size={14} /> Please enter a valid mark between 0 and {maxInternal}.
              </p>
            )}
          </div>

        </div>

        {/* Predictions */}
        {isValidInternal && (
          <div style={{ padding: "0 24px 24px" }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)", marginBottom: 16 }}>Required External Marks (out of {maxExternal})</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
              {GRADES.map((g, i) => {
                const required = g.min - currentInternal;
                const isPossible = required <= maxExternal;
                const isGuaranteed = required <= 0;
                
                let statusColor = "var(--secondary)";
                let statusBg = "var(--bg-main)";
                
                if (isGuaranteed) {
                  statusColor = "var(--success)";
                  statusBg = "rgba(34, 197, 94, 0.1)";
                } else if (!isPossible) {
                  statusColor = "var(--danger)";
                  statusBg = "rgba(239, 68, 68, 0.1)";
                } else if (required > maxExternal * 0.85) {
                  statusColor = "var(--warning)";
                  statusBg = "rgba(245, 158, 11, 0.1)";
                } else {
                  statusColor = "var(--accent)";
                  statusBg = "rgba(62, 166, 255, 0.1)";
                }

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={g.grade}
                    style={{
                      background: statusBg,
                      border: `1px solid ${statusColor}40`,
                      borderRadius: 12,
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 24, fontWeight: 800, color: statusColor }}>{g.grade}</span>
                      <span style={{ fontSize: 12, color: "var(--secondary)", fontWeight: 600 }}>Grade</span>
                    </div>
                    
                    {isGuaranteed ? (
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--success)", display: "flex", alignItems: "center", gap: 4 }}>
                        <CheckCircle size={14} /> Guaranteed!
                      </span>
                    ) : !isPossible ? (
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--danger)", display: "flex", alignItems: "center", gap: 4 }}>
                        <XCircle size={14} /> Impossible
                      </span>
                    ) : (
                      <div style={{ textAlign: "center" }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: "var(--text-main)" }}>{required}</span>
                        <span style={{ fontSize: 12, color: "var(--secondary)", marginLeft: 4 }}>/ {maxExternal}</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
