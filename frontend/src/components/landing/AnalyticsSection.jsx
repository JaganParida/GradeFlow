import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  BarChart2,
  BookOpen,
  Layers,
  Award,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

const SEMESTER_DETAILS = {
  "Sem 1": {
    sgpa: 7.8,
    cgpa: 7.8,
    credits: 22,
    subjects: [
      { code: "CUTM1001", name: "Applied Physics", credits: 4, grade: "A", points: 8 },
      { code: "CUTM1002", name: "Engineering Mathematics I", credits: 4, grade: "E", points: 9 },
      { code: "CUTM1003", name: "Basic Electrical Engineering", credits: 4, grade: "B", points: 7 },
      { code: "CUTM1004", name: "Programming in C", credits: 4, grade: "E", points: 9 },
      { code: "CUTM1005", name: "Professional Communication", credits: 3, grade: "O", points: 10 },
      { code: "CUTM1006", name: "Engineering Workshop", credits: 3, grade: "A", points: 8 },
    ],
  },
  "Sem 2": {
    sgpa: 8.2,
    cgpa: 8.0,
    credits: 22,
    subjects: [
      { code: "CUTM1007", name: "Engineering Chemistry", credits: 4, grade: "E", points: 9 },
      { code: "CUTM1008", name: "Engineering Mathematics II", credits: 4, grade: "A", points: 8 },
      { code: "CUTM1009", name: "Data Structures in C++", credits: 4, grade: "O", points: 10 },
      { code: "CUTM1010", name: "Digital Logic & Design", credits: 4, grade: "A", points: 8 },
      { code: "CUTM1011", name: "Environmental Science", credits: 3, grade: "A", points: 8 },
      { code: "CUTM1012", name: "Design Engineering Lab", credits: 3, grade: "E", points: 9 },
    ],
  },
  "Sem 3": {
    sgpa: 8.45,
    cgpa: 8.15,
    credits: 22,
    subjects: [
      { code: "CUTM1013", name: "Discrete Mathematical Structures", credits: 4, grade: "E", points: 9 },
      { code: "CUTM1014", name: "Object Oriented Programming (Java)", credits: 4, grade: "O", points: 10 },
      { code: "CUTM1015", name: "Computer Organization & Architecture", credits: 4, grade: "A", points: 8 },
      { code: "CUTM1016", name: "Theory of Computation", credits: 4, grade: "A", points: 8 },
      { code: "CUTM1017", name: "Smart Stack: Web Development", credits: 3, grade: "O", points: 10 },
      { code: "CUTM1018", name: "Data Structures Lab", credits: 3, grade: "O", points: 10 },
    ],
  },
  "Sem 4": {
    sgpa: 8.7,
    cgpa: 8.29,
    credits: 20,
    subjects: [
      { code: "CUTM1019", name: "Database Management Systems", credits: 4, grade: "O", points: 10 },
      { code: "CUTM1020", name: "Operating Systems", credits: 4, grade: "E", points: 9 },
      { code: "CUTM1021", name: "Design & Analysis of Algorithms", credits: 4, grade: "E", points: 9 },
      { code: "CUTM1022", name: "Computer Networks", credits: 4, grade: "A", points: 8 },
      { code: "CUTM1023", name: "Database & OS Practical", credits: 4, grade: "O", points: 10 },
    ],
  },
  "Sem 5": {
    sgpa: 8.95,
    cgpa: 8.42,
    credits: 20,
    subjects: [
      { code: "CUTM1024", name: "Software Engineering & Agile", credits: 4, grade: "O", points: 10 },
      { code: "CUTM1025", name: "Compiler Design", credits: 4, grade: "E", points: 9 },
      { code: "CUTM1026", name: "AI & Machine Learning Foundations", credits: 4, grade: "O", points: 10 },
      { code: "CUTM1027", name: "Cloud Infrastructure (AWS/GCP)", credits: 4, grade: "E", points: 9 },
      { code: "CUTM1028", name: "Domain Track Project - Phase I", credits: 4, grade: "O", points: 10 },
    ],
  },
  "Sem 6": {
    sgpa: 9.1,
    cgpa: 8.74,
    credits: 18,
    subjects: [
      { code: "CUTM1029", name: "Distributed Systems & Microservices", credits: 4, grade: "O", points: 10 },
      { code: "CUTM1030", name: "Information Security & Cryptography", credits: 4, grade: "O", points: 10 },
      { code: "CUTM1031", name: "Deep Learning & NLP", credits: 4, grade: "E", points: 9 },
      { code: "CUTM1032", name: "Full Stack Capstone Project", credits: 6, grade: "O", points: 10 },
    ],
  },
};

const GRADE_STYLES = {
  O: { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
  E: { bg: "#dcfce7", text: "#166534", border: "#bbf7d0" },
  A: { bg: "#dbeafe", text: "#1e40af", border: "#bfdbfe" },
  B: { bg: "#f3e8ff", text: "#6b21a8", border: "#e9d5ff" },
};

export default function AnalyticsSection() {
  const [selectedSem, setSelectedSem] = useState("Sem 6");
  const semData = SEMESTER_DETAILS[selectedSem];

  const chartData = Object.entries(SEMESTER_DETAILS).map(([semKey, data]) => ({
    sem: semKey,
    sgpa: data.sgpa,
    cgpa: data.cgpa,
  }));

  return (
    <section
      id="analytics"
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
      {/* 2-Column Split Workbench */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.35fr",
          gap: 28,
          alignItems: "start",
          width: "100%",
          boxSizing: "border-box",
        }}
        className="gf-editorial-split"
      >
        {/* Left Column: Narrative, Semester Switcher & Quick Stats */}
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 700,
              color: "#2563eb",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            <BarChart2 size={15} strokeWidth={2.4} />
            <span>Academic Analytics</span>
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
            See the story behind your grades
          </h2>

          <p
            style={{
              fontSize: "clamp(14.5px, 1.8vw, 16px)",
              lineHeight: 1.6,
              color: "#64748b",
              margin: "0 0 28px 0",
              textWrap: "balance",
            }}
          >
            GradeFlow calculates official university weighted grade points, tracking your performance velocity and credit accumulation from Semester 1 through graduation.
          </p>

          {/* Interactive Semester Switcher */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", marginBottom: 10 }}>
              Select Semester Breakdown
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Object.keys(SEMESTER_DETAILS).map((sem) => {
                const isActive = sem === selectedSem;
                return (
                  <button
                    key={sem}
                    onClick={() => setSelectedSem(sem)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: isActive ? 750 : 600,
                      background: isActive ? "#2563eb" : "#f8fafc",
                      color: isActive ? "#ffffff" : "#475569",
                      border: isActive ? "1px solid #2563eb" : "1px solid #e2e8f0",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {sem}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Key Metrics Snapshot */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
              gap: 12,
              padding: "16px 0",
              borderTop: "1px solid #f1f5f9",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <div>
              <div style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600 }}>{selectedSem} SGPA</div>
              <div style={{ fontSize: 22, fontWeight: 850, color: "#2563eb", fontFamily: "'Space Mono', monospace" }}>
                {semData.sgpa.toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600 }}>Cumulative CGPA</div>
              <div style={{ fontSize: 22, fontWeight: 850, color: "#0f172a", fontFamily: "'Space Mono', monospace" }}>
                {semData.cgpa.toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: "#64748b", fontWeight: 600 }}>Credits Evaluated</div>
              <div style={{ fontSize: 22, fontWeight: 850, color: "#059669", fontFamily: "'Space Mono', monospace" }}>
                {semData.credits} Cr
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Chart & Dynamic Subject Ledger */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid #f1f5f9",
            boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
            padding: "28px",
          }}
        >
          {/* Performance Trajectory Graph */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 750, color: "#0f172a" }}>Multi-Semester GPA Trajectory</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>SGPA &bull; CGPA progression curve</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11.5, fontWeight: 600 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#2563eb" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: "#2563eb" }} /> SGPA
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#64748b" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: "#94a3b8" }} /> CGPA
                </span>
              </div>
            </div>

            <div style={{ width: "100%", height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="analyticsSgpaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="sem" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }} />
                  <YAxis domain={[6.5, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div style={{ background: "#0f172a", color: "#ffffff", padding: "8px 12px", borderRadius: 8, fontSize: 12 }}>
                            <div style={{ fontWeight: 700 }}>{d.sem}</div>
                            <div style={{ color: "#93c5fd" }}>SGPA: {d.sgpa.toFixed(2)}</div>
                            <div style={{ color: "#cbd5e1" }}>CGPA: {d.cgpa.toFixed(2)}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="sgpa" stroke="#2563eb" strokeWidth={2.5} fill="url(#analyticsSgpaGrad)" />
                  <Area type="monotone" dataKey="cgpa" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Dynamic Subject Breakdown Ledger */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 750, color: "#0f172a", marginBottom: 12 }}>
              {selectedSem} Evaluated Courses
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {semData.subjects.map((sub, idx) => {
                const style = GRADE_STYLES[sub.grade] || GRADE_STYLES.O;
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: "#f8fafc",
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 650, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {sub.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        {sub.code} &bull; {sub.credits} Credits
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: style.bg,
                        color: style.text,
                        border: `1px solid ${style.border}`,
                        fontSize: 12,
                        fontWeight: 800,
                        fontFamily: "'Space Mono', monospace",
                      }}
                    >
                      {sub.grade} ({sub.points} pts)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
