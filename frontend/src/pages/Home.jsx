import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { motion } from "framer-motion";
import { GraduationCap, ArrowRight, AlertTriangle, BarChart2, Trophy, TrendingUp, Target, Sparkles, FileText, Star, Sigma } from "lucide-react";

export default function Home() {
  const [regNo, setRegNo] = useState("");
  const { fetchStudent, loading, error } = useApp();
  const navigate = useNavigate();

  async function handleSearch(e) {
    e.preventDefault();
    if (!regNo.trim()) return;
    const data = await fetchStudent(regNo.trim());
    if (data) navigate(`/dashboard/${regNo.trim()}`);
  }

  const features = [
    { label: "SGPA & CGPA", icon: <BarChart2 size={14} /> },
    { label: "Rankings", icon: <Trophy size={14} /> },
    { label: "Analytics", icon: <TrendingUp size={14} /> },
    { label: "Backlogs", icon: <Target size={14} /> },
    { label: "AI Insights", icon: <Sparkles size={14} /> },
    { label: "Grade Sheet", icon: <FileText size={14} /> },
  ];

  const gradeTableData = [
    { grade: "O", range: "90 & above", points: "10", interpretation: "Outstanding", counted: "Yes", color: "#f59e0b" },
    { grade: "E", range: "80 - 89", points: "9", interpretation: "Excellent", counted: "Yes", color: "#22c55e" },
    { grade: "A", range: "70 - 79", points: "8", interpretation: "Very Good", counted: "Yes", color: "#3ea6ff" },
    { grade: "B", range: "60 - 69", points: "7", interpretation: "Good", counted: "Yes", color: "#a855f7" },
    { grade: "C", range: "50 - 59", points: "6", interpretation: "Fair (Average)", counted: "Yes", color: "#f97316" },
    { grade: "D", range: "40 - 49", points: "5", interpretation: "Pass (Theory Only)", counted: "Yes", color: "#9ca3af" },
    { grade: "F", range: "Below 40", points: "2", interpretation: "Failed", counted: "Yes", color: "#ef4444" },
    { grade: "R", range: "Non-Clearance", points: "0", interpretation: "Repeat", counted: "Yes", color: "#f43f5e" },
    { grade: "M", range: "—", points: "0", interpretation: "Malpractice", counted: "No", color: "#64748b" },
    { grade: "S", range: "—", points: "0", interpretation: "Absent", counted: "No", color: "#64748b" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "100px 24px 60px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background gradient orbs */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          background: "radial-gradient(circle, rgba(62,166,255,0.08) 0%, transparent 70%)",
          top: "10%",
          left: "20%",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          background: "radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)",
          bottom: "15%",
          right: "15%",
          pointerEvents: "none",
        }}
      />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{
          textAlign: "center",
          maxWidth: 600,
          position: "relative",
          zIndex: 1,
          width: "100%",
        }}
      >
        {/* Logo */}
        <div style={{ marginBottom: 24 }}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            style={{
              width: 64,
              height: 64,
              background: "linear-gradient(135deg, var(--accent), #7c3aed)",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 0 40px rgba(62,166,255,0.3)",
            }}
          >
            <GraduationCap color="#fff" size={32} />
          </motion.div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(62,166,255,0.1)",
              border: "1px solid rgba(62,166,255,0.2)",
              borderRadius: 20,
              padding: "4px 12px",
              fontSize: 12,
              color: "var(--accent)",
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            ✦ Academic Analytics Platform
          </div>
        </div>

        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 58px)",
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 16,
            letterSpacing: -1,
          }}
        >
          Track Your Academic
          <span
            style={{
              display: "block",
              background: "linear-gradient(135deg, var(--accent), #a855f7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Journey
          </span>
        </h1>

        <p
          style={{
            color: "var(--secondary)",
            fontSize: 17,
            marginBottom: 40,
            lineHeight: 1.7,
          }}
        >
          View your grades, SGPA, CGPA, rankings, analytics, and academic
          insights — all in one place.
        </p>

        {/* Search */}
        <form onSubmit={handleSearch}>
          <div
            style={{
              display: "flex",
              gap: 12,
              maxWidth: 500,
              margin: "0 auto",
              flexWrap: "wrap",
            }}
          >
            <input
              value={regNo}
              onChange={(e) => setRegNo(e.target.value)}
              placeholder="Registration No. (e.g. 230301120170)"
              style={{ flex: "1 1 260px", fontSize: 15, padding: "14px 20px", borderRadius: 12 }}
              disabled={loading}
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              style={{ flex: "1 1 120px", whiteSpace: "nowrap", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, fontSize: 15 }}
            >
              {loading ? "Searching..." : "Search"}
              {!loading && <ArrowRight size={18} />}
            </motion.button>
          </div>
          {error && (
            <p style={{ color: "var(--danger)", marginTop: 12, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <AlertTriangle size={16} /> {error}
            </p>
          )}
        </form>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: 48,
          }}
        >
          {features.map((f, i) => (
            <motion.span
              key={f.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              whileHover={{ y: -2, background: "rgba(255,255,255,0.05)" }}
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 13,
                color: "var(--secondary)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "default"
              }}
            >
              {f.icon} {f.label}
            </motion.span>
          ))}
        </div>
      </motion.div>

      <div
        style={{
          width: "100%",
          maxWidth: 1000,
          margin: "80px auto 0",
          display: "flex",
          flexDirection: "column",
          gap: 40,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Grade Interpretation System */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="card"
          style={{ padding: 32, background: "rgba(20,20,20,0.4)", backdropFilter: "blur(20px)" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ background: "rgba(168,85,247,0.1)", padding: 10, borderRadius: 12 }}>
              <Star color="#a855f7" size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700 }}>Grading Scale</h3>
              <p style={{ color: "var(--secondary)", fontSize: 13 }}>Standard university grade point mapping</p>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 500 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1.5fr 1fr 1fr", gap: 12, padding: "0 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: 12, fontSize: 11, fontWeight: 700, color: "var(--secondary)", textTransform: "uppercase", letterSpacing: 1 }}>
                <span>Grade</span>
                <span>Qualification</span>
                <span>Range</span>
                <span>Points</span>
                <span style={{ textAlign: "right" }}>Counted?</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {gradeTableData.map((row, i) => (
              <motion.div
                key={row.grade}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                whileHover={{ scale: 1.02, background: "rgba(255,255,255,0.03)" }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 2fr 1.5fr 1fr 1fr",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  cursor: "default"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${row.color}15`, color: row.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                    {row.grade}
                  </div>
                </div>
                
                <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>
                  {row.interpretation}
                </div>

                <div style={{ fontSize: 12, color: "var(--secondary)", fontFamily: "Space Mono, monospace" }}>
                  {row.range}
                </div>

                <div style={{ fontSize: 14, fontWeight: 700, color: row.color }}>
                  {row.points}
                </div>
                
                <div style={{ textAlign: "right" }}>
                  <span style={{ padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: row.counted === "Yes" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)", color: row.counted === "Yes" ? "#22c55e" : "#ef4444" }}>
                    {row.counted}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
            </div>
          </div>
        </motion.div>

        {/* Core Algorithms */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="card"
          style={{ padding: 32, background: "rgba(20,20,20,0.4)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ background: "rgba(62,166,255,0.1)", padding: 10, borderRadius: 12 }}>
              <Sigma color="#3ea6ff" size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700 }}>Core Algorithms</h3>
              <p style={{ color: "var(--secondary)", fontSize: 13 }}>The mathematical logic behind calculations</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* SGPA Formula */}
            <div style={{ background: "rgba(255,255,255,0.02)", padding: 24, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
              <h4 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                1. SGPA (Semester Grade Point Average) Formula
              </h4>
              <p style={{ fontSize: 14, color: "var(--secondary)", lineHeight: 1.6, marginBottom: 20 }}>
                The SGPA measures your academic performance for a single semester. It is the ratio of your total earned Credit Points to the total Course Credits registered.
              </p>
              
              <div style={{ display: "flex", justifyContent: "center", padding: "24px 0", marginBottom: 20 }}>
                <div style={{ fontFamily: "Space Mono, monospace", fontSize: 20, fontWeight: 600, color: "#a855f7", display: "flex", alignItems: "center", gap: 12 }}>
                  <span>SGPA =</span>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <span style={{ borderBottom: "1px solid #a855f7", paddingBottom: 4 }}>Σ(Cᵢ × Gᵢ)</span>
                    <span>ΣCᵢ</span>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 14, color: "var(--secondary)" }}>
                <p style={{ fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>Where:</p>
                <ul style={{ display: "flex", flexDirection: "column", gap: 10, paddingLeft: 20 }}>
                  <li><strong style={{ color: "var(--text)" }}>Cᵢ</strong> = The number of credits assigned to the i-th subject.</li>
                  <li><strong style={{ color: "var(--text)" }}>Gᵢ</strong> = The grade point secured in the i-th subject (e.g., O = 10, E = 9, F = 2, R = 0).</li>
                  <li><strong style={{ color: "var(--text)" }}>n</strong> = The total number of subjects registered in that semester.</li>
                </ul>
              </div>
            </div>

            {/* CGPA Formula */}
            <div style={{ background: "rgba(255,255,255,0.02)", padding: 24, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
              <h4 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                2. CGPA (Cumulative Grade Point Average) Formula
              </h4>
              <p style={{ fontSize: 14, color: "var(--secondary)", lineHeight: 1.6, marginBottom: 20 }}>
                The CGPA measures your cumulative academic performance across all semesters completed so far. It is a weighted average of your SGPAs based on the total credits assigned to each individual semester.
              </p>
              
              <div style={{ display: "flex", justifyContent: "center", padding: "24px 0", marginBottom: 20 }}>
                <div style={{ fontFamily: "Space Mono, monospace", fontSize: 20, fontWeight: 600, color: "#3ea6ff", display: "flex", alignItems: "center", gap: 12 }}>
                  <span>CGPA =</span>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <span style={{ borderBottom: "1px solid #3ea6ff", paddingBottom: 4 }}>Σ(SGPAⱼ × Crⱼ)</span>
                    <span>ΣCrⱼ</span>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 14, color: "var(--secondary)" }}>
                <p style={{ fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>Where:</p>
                <ul style={{ display: "flex", flexDirection: "column", gap: 10, paddingLeft: 20 }}>
                  <li><strong style={{ color: "var(--text)" }}>SGPAⱼ</strong> = The final SGPA scored in the j-th semester.</li>
                  <li><strong style={{ color: "var(--text)" }}>Crⱼ</strong> = The total number of registered credits assigned to that specific j-th semester.</li>
                  <li><strong style={{ color: "var(--text)" }}>m</strong> = The total number of semesters completed up to the current date.</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: 24, padding: 16, borderRadius: 12, background: "rgba(62,166,255,0.05)", border: "1px dashed rgba(62,166,255,0.3)" }}>
            <p style={{ fontSize: 12, color: "var(--secondary)", lineHeight: 1.6 }}>
              <span style={{ color: "#3ea6ff", fontWeight: 700 }}>Note:</span> Special rules apply: M (Malpractice) and S (Absent) credits are entirely excluded. A 6-credit Semester 5 Project with an R grade is ignored. Backlogs dynamically update affected SGPAs!
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
