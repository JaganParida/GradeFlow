import React from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  Award,
  BookOpen,
  CheckCircle2,
  Lock,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Target,
} from "lucide-react";

const DEMO_SEMESTER_DATA = [
  { sem: "Sem 1", sgpa: 7.8, cgpa: 7.8 },
  { sem: "Sem 2", sgpa: 8.2, cgpa: 8.0 },
  { sem: "Sem 3", sgpa: 8.45, cgpa: 8.15 },
  { sem: "Sem 4", sgpa: 8.7, cgpa: 8.29 },
  { sem: "Sem 5", sgpa: 8.95, cgpa: 8.42 },
  { sem: "Sem 6", sgpa: 9.1, cgpa: 8.74 },
];

const DEMO_SUBJECTS = [
  { name: "Distributed Systems & Cloud", code: "CUTM1042", credits: 4, grade: "O", pts: 10, type: "Core Engineering" },
  { name: "Advanced Data Structures", code: "CUTM1028", credits: 4, grade: "O", pts: 10, type: "Core Engineering" },
  { name: "Machine Learning & AI", code: "CUTM1105", credits: 4, grade: "E", pts: 9, type: "Domain Specialization" },
  { name: "Database Engineering", code: "CUTM1034", credits: 3, grade: "E", pts: 9, type: "Core Engineering" },
];

const GRADE_BADGE_STYLES = {
  O: { bg: "#fef3c7", text: "#b45309", border: "#fde68a" },
  E: { bg: "#dcfce7", text: "#15803d", border: "#bbf7d0" },
  A: { bg: "#dbeafe", text: "#1d4ed8", border: "#bfdbfe" },
  B: { bg: "#f3e8ff", text: "#7e22ce", border: "#e9d5ff" },
};

export default function ProductPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
      className="gf-hero-preview-container"
      style={{
        maxWidth: 1120,
        margin: "0 auto",
        perspective: "1200px",
      }}
    >
      {/* Browser Window Frame */}
      <div
        className="gf-browser-frame"
        style={{
          background: "#ffffff",
          borderRadius: 18,
          border: "1px solid #cbd5e1",
          boxShadow:
            "0 20px 50px -12px rgba(15, 23, 42, 0.12), 0 4px 16px rgba(15, 23, 42, 0.04)",
          overflow: "hidden",
        }}
      >
        {/* Browser Top Navigation Bar / Chrome */}
        <div
          style={{
            background: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          {/* Traffic Lights */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#f87171" }} />
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#fbbf24" }} />
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#4ade80" }} />
          </div>

          {/* URL Pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "5px 14px",
              fontSize: 12,
              color: "#475569",
              fontFamily: "'Space Mono', monospace",
              width: "100%",
              maxWidth: 360,
              boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
            }}
          >
            <Lock size={12} color="#10b981" />
            <span style={{ color: "#0f172a", fontWeight: 600 }}>gradeflow.app</span>
            <span style={{ color: "#94a3b8" }}>/student/overview</span>
          </div>

          {/* Active Status Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11.5,
                fontWeight: 600,
                color: "#166534",
                background: "#dcfce7",
                padding: "3px 9px",
                borderRadius: 6,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#16a34a",
                }}
              />
              Live UI Preview
            </span>
          </div>
        </div>

        {/* Dashboard Content Inside Frame */}
        <div style={{ padding: "24px 28px", background: "#fcfdfe" }}>
          {/* Header Banner Inside Preview */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 14,
              paddingBottom: 20,
              borderBottom: "1px solid #f1f5f9",
              marginBottom: 20,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: 0,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Academic Intelligence Hub
                </h3>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#2563eb",
                    background: "#eff6ff",
                    padding: "3px 8px",
                    borderRadius: 6,
                    border: "1px solid #dbeafe",
                  }}
                >
                  Sem 6 Active
                </span>
              </div>
              <p style={{ margin: "3px 0 0", fontSize: 13, color: "#64748b" }}>
                B.Tech Computer Science &bull; 160 Credit Graduation Path
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "#0f172a",
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  padding: "6px 12px",
                  borderRadius: 8,
                }}
              >
                <Award size={15} color="#f59e0b" />
                <span>Top 5% Cohort</span>
              </div>
            </div>
          </div>

          {/* 4 Real Metric Chips */}
          <div
            className="gf-preview-metrics-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 14,
              marginBottom: 22,
            }}
          >
            {/* Metric 1: CGPA */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: "16px 18px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>
                Cumulative CGPA
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#0f172a",
                    fontFamily: "'Space Mono', monospace",
                    lineHeight: 1,
                  }}
                >
                  8.74
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#16a34a",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  ↑ +0.32
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Out of 10.0 scale</div>
            </div>

            {/* Metric 2: Latest SGPA */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: "16px 18px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>
                Latest SGPA (Sem 6)
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#2563eb",
                    fontFamily: "'Space Mono', monospace",
                    lineHeight: 1,
                  }}
                >
                  9.10
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: "#2563eb",
                    background: "#eff6ff",
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  Distinction
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>22 Credits evaluated</div>
            </div>

            {/* Metric 3: Credits Completed */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: "16px 18px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>
                Degree Credits
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#0f172a",
                    fontFamily: "'Space Mono', monospace",
                    lineHeight: 1,
                  }}
                >
                  124
                </span>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>/ 160</span>
              </div>
              <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 600, marginTop: 4 }}>
                77.5% Complete (On Track)
              </div>
            </div>

            {/* Metric 4: Placement Readiness */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: "16px 18px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>
                Placement Readiness
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#16a34a",
                    fontFamily: "'Space Mono', monospace",
                    lineHeight: 1,
                  }}
                >
                  42+
                </span>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Eligible</span>
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                Tier 1 & Product Cutoffs met
              </div>
            </div>
          </div>

          {/* Split View: Trajectory Chart (Left) + Subject Breakdown (Right) */}
          <div
            className="gf-preview-split-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.95fr",
              gap: 16,
            }}
          >
            {/* Left: Trend Chart */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: "18px 20px",
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
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                    Performance Trajectory
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    SGPA & CGPA progression across 6 completed semesters
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, fontWeight: 600 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#2563eb" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: "#2563eb" }} /> SGPA
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#64748b" }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: "#94a3b8" }} /> CGPA
                  </span>
                </div>
              </div>

              <div style={{ width: "100%", height: 210, marginTop: 4 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={DEMO_SEMESTER_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="previewSgpaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="sem"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
                    />
                    <YAxis
                      domain={[6.5, 10]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div
                              style={{
                                background: "#0f172a",
                                color: "#ffffff",
                                padding: "8px 12px",
                                borderRadius: 8,
                                fontSize: 12,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                              }}
                            >
                              <div style={{ fontWeight: 700, marginBottom: 2 }}>{data.sem}</div>
                              <div style={{ color: "#93c5fd" }}>SGPA: {data.sgpa}</div>
                              <div style={{ color: "#cbd5e1" }}>CGPA: {data.cgpa}</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sgpa"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#previewSgpaGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Semester 6 Subject Breakdown */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                    Recent Course Records
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Semester 6 core & domain grades</div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#16a34a",
                    background: "#dcfce7",
                    padding: "2px 7px",
                    borderRadius: 5,
                  }}
                >
                  All Cleared
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                {DEMO_SUBJECTS.map((sub, idx) => {
                  const style = GRADE_BADGE_STYLES[sub.grade] || GRADE_BADGE_STYLES.O;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 10px",
                        background: "#f8fafc",
                        border: "1px solid #f1f5f9",
                        borderRadius: 9,
                        gap: 10,
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: "#0f172a",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {sub.name}
                        </div>
                        <div style={{ fontSize: 10.5, color: "#64748b" }}>
                          {sub.code} &bull; {sub.credits} Credits
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 8px",
                            borderRadius: 6,
                            background: style.bg,
                            color: style.text,
                            border: `1px solid ${style.border}`,
                            fontSize: 12,
                            fontWeight: 800,
                            fontFamily: "'Space Mono', monospace",
                          }}
                        >
                          {sub.grade}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
