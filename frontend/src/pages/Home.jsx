import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  ArrowRight,
  AlertTriangle,
  BarChart2,
  Trophy,
  TrendingUp,
  Target,
  Sparkles,
  FileText,
  BookOpen,
  Star,
  Calculator,
  Info,
  ChevronDown,
} from "lucide-react";

/* ─── Social Icons ─────────────────────────────────────────────── */
const GithubIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

const LinkedinIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const InstagramIcon = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

/* ─── Grade Data ─────────────────────────────────────────────── */
const GRADE_SCALE = [
  { grade: "O",  qual: "Outstanding",       range: "90 & above",  pts: 10, color: "#f59e0b", bg: "rgba(245,158,11,0.12)", counted: true },
  { grade: "E",  qual: "Excellent",          range: "80 – 89",     pts: 9,  color: "#22c55e", bg: "rgba(34,197,94,0.12)",  counted: true },
  { grade: "A",  qual: "Very Good",          range: "70 – 79",     pts: 8,  color: "#3ea6ff", bg: "rgba(62,166,255,0.12)", counted: true },
  { grade: "B",  qual: "Good",               range: "60 – 69",     pts: 7,  color: "#a855f7", bg: "rgba(168,85,247,0.12)", counted: true },
  { grade: "C",  qual: "Fair (Average)",     range: "50 – 59",     pts: 6,  color: "#f97316", bg: "rgba(249,115,22,0.12)", counted: true },
  { grade: "D",  qual: "Pass (Theory Only)", range: "40 – 49",     pts: 5,  color: "#6b7280", bg: "rgba(107,114,128,0.10)",counted: true },
  { grade: "F",  qual: "Failed",             range: "Below 40",    pts: 2,  color: "#ef4444", bg: "rgba(239,68,68,0.10)",  counted: true },
  { grade: "R",  qual: "Repeat / Retake",   range: "Non-Clearance",pts: 0,  color: "#f97316", bg: "rgba(249,115,22,0.08)", counted: true },
  { grade: "M",  qual: "Malpractice",        range: "—",           pts: 0,  color: "#6b7280", bg: "rgba(107,114,128,0.07)",counted: false },
  { grade: "S",  qual: "Absent",             range: "—",           pts: 0,  color: "#6b7280", bg: "rgba(107,114,128,0.07)",counted: false },
];

const FEATURES = [
  { label: "SGPA & CGPA", icon: <BarChart2 size={14} />, color: "#3ea6ff" },
  { label: "Internal Marks", icon: <GraduationCap size={14} />, color: "#ec4899" },
  { label: "Rankings",    icon: <Trophy size={14} />,    color: "#f59e0b" },
  { label: "Analytics",  icon: <TrendingUp size={14} />, color: "#22c55e" },
  { label: "Backlogs",   icon: <Target size={14} />,     color: "#ef4444" },
  { label: "AI Insights",icon: <Sparkles size={14} />,   color: "#a855f7" },
  { label: "Grade Sheet",icon: <FileText size={14} />,   color: "#f97316" },
  { label: "Testimonials",icon: <Star size={14} />,      color: "#14b8a6" },
];

/* ─── Fraction component ─────────────────────────────────────── */
function Fraction({ num, den }) {
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", lineHeight: 1.2, verticalAlign: "middle", margin: "0 6px" }}>
      <span style={{ borderBottom: "1.5px solid currentColor", paddingBottom: 2, whiteSpace: "nowrap", fontSize: "0.9em" }}>{num}</span>
      <span style={{ paddingTop: 2, whiteSpace: "nowrap", fontSize: "0.9em" }}>{den}</span>
    </span>
  );
}

/* ─── Inline styles (avoids extra CSS file) ───────────────────── */
const S = {
  section: {
    width: "100%",
    maxWidth: 900,
    margin: "0 auto",
  },
  sectionCard: {
    background: "#212121",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: "32px 28px",
  },
  sectionHead: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 28,
  },
  iconBox: (color) => ({
    width: 40,
    height: 40,
    borderRadius: 12,
    background: color + "20",
    border: `1px solid ${color}30`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  }),
  pill: (active) => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.4px",
    background: active ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
    color: active ? "#22c55e" : "#ef4444",
    border: `1px solid ${active ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
  }),
};

export default function Home() {
  const [regNo, setRegNo] = useState("");
  const [showGradeTable, setShowGradeTable] = useState(true);
  const { fetchStudent, loading, error } = useApp();
  const navigate = useNavigate();

  async function handleSearch(e) {
    e.preventDefault();
    if (loading || !regNo.trim()) return;
    const searchRegNo = regNo.trim();
    const success = await fetchStudent(searchRegNo);
    if (success) navigate(`/dashboard/${searchRegNo}`);
  }

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
        padding: "90px 16px 80px",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Removed Background Orbs to match clean UI */}

      {/* ════════════════════════════════════════════
          HERO SECTION
      ════════════════════════════════════════════ */}
      <motion.section
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          width: "100%",
          maxWidth: 720,
          textAlign: "center",
          position: "relative",
          zIndex: 1,
          marginBottom: 72,
        }}
      >
        {/* Badge */}
        <div style={{ marginBottom: 20 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(62,166,255,0.1)", border: "1px solid rgba(62,166,255,0.2)",
            borderRadius: 20, padding: "5px 14px",
            fontSize: 12, color: "var(--accent)", fontWeight: 600, letterSpacing: "0.3px",
          }}>
            ✦ Centurion University · Academic Analytics
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: "clamp(32px, 6vw, 56px)",
          fontWeight: 800, lineHeight: 1.1,
          marginBottom: 18, letterSpacing: -1,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Track Your Academic{" "}
          <span style={{
            background: "linear-gradient(135deg, #3ea6ff, #a855f7)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>Journey</span>
        </h1>

        <p style={{
          color: "var(--secondary)", fontSize: "clamp(15px, 2vw, 18px)",
          lineHeight: 1.75, marginBottom: 44,
          maxWidth: 540, margin: "0 auto 44px",
        }}>
          View grades, SGPA, CGPA, rankings, analytics &amp; insights — all in one place, instantly.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ width: "100%" }}>
          <div
            className="home-search-wrap"
            style={{
            display: "flex", gap: 12,
            maxWidth: 640, width: "100%",
            margin: "0 auto",
            flexWrap: "wrap",
          }}>
            <input
              value={regNo}
              onChange={(e) => setRegNo(e.target.value)}
              placeholder="Registration No. (e.g. 230301120170)"
              style={{
                flex: "1 1 240px", fontSize: 16,
                padding: "16px 24px", borderRadius: 20,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                color: "var(--text)", outline: "none",
                transition: "all 0.3s cubic-bezier(0.25, 1, 0.5, 1)",
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              disabled={loading}
            />
            <motion.button
              whileHover={loading ? {} : { scale: 1.03 }}
              whileTap={loading ? {} : { scale: 0.96 }}
              type="submit"
              disabled={loading}
              style={{
                flex: "0 0 auto",
                background: loading ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #3ea6ff, #3b82f6)",
                border: "none", padding: "16px 32px", borderRadius: 20,
                color: loading ? "rgba(255,255,255,0.4)" : "#fff",
                fontWeight: 700, fontSize: 16,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                boxShadow: loading ? "none" : "0 8px 24px rgba(62,166,255,0.4)",
                transition: "all 0.3s cubic-bezier(0.25, 1, 0.5, 1)", whiteSpace: "nowrap",
              }}
            >
              {loading ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <div style={{ width:18, height:18, border:"2px solid rgba(255,255,255,0.25)", borderTopColor:"#fff", borderRadius:"50%" }} />
                  </motion.div>
                  Searching…
                </>
              ) : (<>Search <ArrowRight size={18} /></>)}
            </motion.button>
          </div>
        </form>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              style={{
                marginTop: 20, padding: "14px 18px",
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 12, color: "var(--danger)",
                display: "flex", alignItems: "center", gap: 10,
                fontSize: 13, maxWidth: 480, margin: "20px auto 0",
              }}
            >
              <AlertTriangle size={16} style={{ flexShrink:0 }} />
              <span style={{ textAlign:"left", lineHeight:1.5 }}>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feature Chips */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 10,
          justifyContent: "center", marginTop: 44,
        }}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity:0, y:8 }}
              animate={{ opacity:1, y:0 }}
              whileHover={{ scale: 1.05, backgroundColor: `${f.color}15`, borderColor: `${f.color}50`, color: "#ffffff" }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 16px",
                background: "#212121",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 24, fontSize: 13, color: "var(--secondary)",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
              }}
            >
              <span style={{ color: f.color }}>{f.icon}</span>
              <span style={{ fontWeight: 500 }}>{f.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ════════════════════════════════════════════
          FORMULA SECTION
      ════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity:0, y:30 }}
        animate={{ opacity:1, y:0 }}
        transition={{ delay: 0.3 }}
        style={{ ...S.section, marginBottom: 28, position:"relative", zIndex:1 }}
      >
        <div style={S.sectionCard}>
          {/* Header */}
          <div style={S.sectionHead}>
            <div style={S.iconBox("#3ea6ff")}>
              <Calculator size={20} color="#3ea6ff" />
            </div>
            <div>
              <h2 style={{ fontSize: "clamp(18px, 3vw, 22px)", fontWeight: 800, marginBottom: 2 }}>
                How SGPA &amp; CGPA Are Calculated
              </h2>
              <p style={{ color: "var(--secondary)", fontSize: 13 }}>
                Official formula used by Centurion University
              </p>
            </div>
          </div>

          {/* Two formula cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
            gap: 16,
          }}>
            {/* SGPA Card */}
            <div style={{
              background: "#212121", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16, padding: "24px 20px",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <div style={{ width:32, height:32, borderRadius:10, background:"rgba(62,166,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <BarChart2 size={16} color="#3ea6ff" />
                </div>
                <div>
                  <div style={{ fontWeight:800, fontSize:15, color:"#3ea6ff" }}>SGPA</div>
                  <div style={{ fontSize:11, color:"var(--secondary)" }}>Semester Grade Point Average</div>
                </div>
              </div>

              {/* Visual fraction formula */}
              <div style={{
                background: "rgba(0,0,0,0.3)", borderRadius: 12,
                padding: "18px 12px", textAlign: "center",
                fontFamily: "'Space Mono', monospace",
                marginBottom: 16,
              }}>
                <span style={{ color:"var(--text)", fontSize:"clamp(10px, 3.5vw, 15px)", fontWeight:600, whiteSpace:"nowrap" }}>
                  SGPA =
                  <Fraction
                    num="Σ(Credit × Grade Points)"
                    den="Σ Total Credits"
                  />
                </span>
              </div>

              <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  { step:"1", text:"Multiply each subject's credit by its grade point" },
                  { step:"2", text:"Sum all weighted values together" },
                  { step:"3", text:"Divide by total credits registered that semester" },
                  { step:"✦", text:"All grades (incl. F=2, R=0, S=0, M=0) are counted", accent:true },
                ].map((item) => (
                  <li key={item.step} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                    <span style={{
                      minWidth: 22, height: 22, borderRadius: 7,
                      background: item.accent ? "rgba(62,166,255,0.2)" : "rgba(255,255,255,0.06)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize: 11, fontWeight:700, color: item.accent ? "#3ea6ff" : "var(--secondary)",
                      flexShrink:0, marginTop:1,
                    }}>{item.step}</span>
                    <span style={{ fontSize:13, color: item.accent ? "#3ea6ff" : "var(--secondary)", lineHeight:1.5 }}>
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CGPA Card */}
            <div style={{
              background: "#212121", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16, padding: "24px 20px",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <div style={{ width:32, height:32, borderRadius:10, background:"rgba(168,85,247,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <TrendingUp size={16} color="#a855f7" />
                </div>
                <div>
                  <div style={{ fontWeight:800, fontSize:15, color:"#a855f7" }}>CGPA</div>
                  <div style={{ fontSize:11, color:"var(--secondary)" }}>Cumulative Grade Point Average</div>
                </div>
              </div>

              <div style={{
                background: "rgba(0,0,0,0.3)", borderRadius: 12,
                padding: "18px 12px", textAlign: "center",
                fontFamily: "'Space Mono', monospace",
                marginBottom: 16,
              }}>
                <span style={{ color:"var(--text)", fontSize:"clamp(10px, 3.5vw, 14px)", fontWeight:600, whiteSpace:"nowrap" }}>
                  CGPA =
                  <Fraction
                    num="Σ(Sem SGPA × Sem Credits)"
                    den="Σ Total Credits"
                  />
                </span>
              </div>

              <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  { step:"1", text:"Calculate SGPA for each completed semester" },
                  { step:"2", text:"Multiply each SGPA by that semester's total credits" },
                  { step:"3", text:"Sum all products, then divide by cumulative credits" },
                  { step:"✦", text:"Weighted average — more credits = more influence", accent:true },
                ].map((item) => (
                  <li key={item.step} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                    <span style={{
                      minWidth: 22, height: 22, borderRadius: 7,
                      background: item.accent ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.06)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize: 11, fontWeight:700, color: item.accent ? "#a855f7" : "var(--secondary)",
                      flexShrink:0, marginTop:1,
                    }}>{item.step}</span>
                    <span style={{ fontSize:13, color: item.accent ? "#a855f7" : "var(--secondary)", lineHeight:1.5 }}>
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quick note */}
          <div style={{
            marginTop: 16,
            padding: "14px 18px",
            background: "rgba(245,158,11,0.06)",
            border: "1px solid rgba(245,158,11,0.15)",
            borderRadius: 12,
            display: "flex", gap:12, alignItems:"flex-start",
          }}>
            <Info size={16} color="#f59e0b" style={{ flexShrink:0, marginTop:2 }} />
            <p style={{ fontSize:13, color:"var(--secondary)", lineHeight:1.6 }}>
              <strong style={{ color:"#f59e0b" }}>Note on Simple Averaging:</strong> You can use{" "}
              <em>CGPA = Σ All SGPAs / Total Semesters</em> only when every semester has the exact
              same number of total credits. Otherwise the credit-weighted formula above must be used.
            </p>
          </div>
        </div>
      </motion.section>

      {/* ════════════════════════════════════════════
          GRADE SCALE TABLE
      ════════════════════════════════════════════ */}
      <motion.section
        initial={{ opacity:0, y:30 }}
        animate={{ opacity:1, y:0 }}
        transition={{ delay: 0.4 }}
        style={{ ...S.section, marginBottom: 80, position:"relative", zIndex:1 }}
      >
        <div style={S.sectionCard}>
          {/* Header with toggle */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom: showGradeTable ? 28 : 0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={S.iconBox("#f59e0b")}>
                <Star size={20} color="#f59e0b" />
              </div>
              <div>
                <h2 style={{ fontSize:"clamp(18px, 3vw, 22px)", fontWeight:800, marginBottom:2 }}>
                  Grading Scale
                </h2>
                <p style={{ color:"var(--secondary)", fontSize:13 }}>
                  Standard university grade point mapping
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowGradeTable(v => !v)}
              style={{
                background: "#212121", border:"1px solid rgba(255,255,255,0.08)",
                borderRadius:10, padding:"8px 14px",
                color:"var(--secondary)", cursor:"pointer",
                display:"flex", alignItems:"center", gap:6, fontSize:13,
                transition:"all 0.2s",
              }}
            >
              {showGradeTable ? "Collapse" : "Show Table"}
              <motion.span animate={{ rotate: showGradeTable ? 180 : 0 }} transition={{ duration:0.2 }}>
                <ChevronDown size={15} />
              </motion.span>
            </button>
          </div>

          <AnimatePresence initial={false}>
            {showGradeTable && (
              <motion.div
                key="table"
                initial={{ opacity:0, height:0 }}
                animate={{ opacity:1, height:"auto" }}
                exit={{ opacity:0, height:0 }}
                style={{ overflow:"hidden" }}
              >

                {/* Column headers — hidden on mobile */}
                <div className="gs-header" style={{
                  display: "grid",
                  gridTemplateColumns: "64px 1fr 130px 80px 100px",
                  gap: 8,
                  padding: "0 12px 12px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  marginBottom: 10,
                }}>
                  {["Grade", "Qualification", "Range", "Points", "Counted?"].map(h => (
                    <span key={h} style={{
                      fontSize:10, fontWeight:700, color:"var(--secondary)",
                      textTransform:"uppercase", letterSpacing:"0.8px",
                    }}>{h}</span>
                  ))}
                </div>

                {/* Grade Rows */}
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {GRADE_SCALE.map((row, i) => (
                    <motion.div
                      key={row.grade}
                      initial={{ opacity:0, x:-10 }}
                      animate={{ opacity:1, x:0 }}
                      transition={{ delay: i * 0.04 }}
                      className="gs-row"
                      style={{
                        borderRadius: 12,
                        background: row.bg,
                        border: `1px solid ${row.color}20`,
                        overflow: "hidden",
                      }}
                    >
                      {/* Desktop row */}
                      <div className="gs-row-desktop" style={{
                        display: "grid",
                        gridTemplateColumns: "64px 1fr 130px 80px 100px",
                        gap: 8, padding: "13px 12px",
                        alignItems: "center",
                      }}>
                        <div style={{
                          width:38, height:38, borderRadius:10,
                          background: row.color + "25",
                          border: `1.5px solid ${row.color}50`,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontWeight:800, fontSize:16, color:row.color,
                          fontFamily:"'Space Mono', monospace",
                        }}>{row.grade}</div>
                        <span style={{ fontWeight:600, fontSize:14, color:"var(--text)" }}>{row.qual}</span>
                        <span style={{ fontSize:13, color:"var(--secondary)", fontFamily:"'Space Mono', monospace" }}>{row.range}</span>
                        <span style={{ fontWeight:800, fontSize:20, color: row.pts >= 5 ? row.color : row.pts === 2 ? "#ef4444" : "var(--secondary)", fontFamily:"'Space Mono', monospace" }}>{row.pts}</span>
                        <div><span style={S.pill(row.counted)}>{row.counted ? "Yes" : "No"}</span></div>
                      </div>

                      {/* Mobile card (stacked) with perfect grid headers */}
                      <div className="gs-row-mobile" style={{ display:"none", padding:"18px 20px" }}>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1.5fr", gap:16 }}>
                          {/* Left Column */}
                          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                              <span style={{ fontSize:10, fontWeight:800, color:"var(--secondary)", textTransform:"uppercase", letterSpacing:"0.5px" }}>Grade</span>
                              <div style={{
                                width:46, height:46, borderRadius:12,
                                background: row.color + "25", border:`1.5px solid ${row.color}50`,
                                display:"flex", alignItems:"center", justifyContent:"center",
                                fontWeight:800, fontSize:20, color:row.color,
                                fontFamily:"'Space Mono', monospace",
                              }}>{row.grade}</div>
                            </div>
                            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                              <span style={{ fontSize:10, fontWeight:800, color:"var(--secondary)", textTransform:"uppercase", letterSpacing:"0.5px" }}>Points</span>
                              <span style={{ fontWeight:800, fontSize:22, color: row.pts >= 5 ? row.color : row.pts === 2 ? "#ef4444" : "var(--secondary)", fontFamily:"'Space Mono', monospace" }}>{row.pts}</span>
                            </div>
                          </div>
                          
                          {/* Right Column */}
                          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                              <span style={{ fontSize:10, fontWeight:800, color:"var(--secondary)", textTransform:"uppercase", letterSpacing:"0.5px" }}>Qualification</span>
                              <div style={{ fontWeight:700, fontSize:16, color:"var(--text)" }}>{row.qual}</div>
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                <span style={{ fontSize:10, fontWeight:800, color:"var(--secondary)", textTransform:"uppercase", letterSpacing:"0.5px" }}>Range:</span>
                                <span style={{ fontSize:13, color:"var(--secondary)", fontFamily:"'Space Mono', monospace" }}>{row.range}</span>
                              </div>
                            </div>
                            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                              <span style={{ fontSize:10, fontWeight:800, color:"var(--secondary)", textTransform:"uppercase", letterSpacing:"0.5px" }}>Counted?</span>
                              <div>
                                <span style={S.pill(row.counted)}>{row.counted ? "Yes" : "No"}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Legend */}
                <div style={{
                  marginTop:20, padding:"14px 18px",
                  background:"rgba(62,166,255,0.05)",
                  border:"1px solid rgba(62,166,255,0.12)",
                  borderRadius:12,
                  display:"flex", alignItems:"flex-start", gap:12,
                }}>
                  <BookOpen size={16} color="#3ea6ff" style={{ flexShrink:0, marginTop:2 }} />
                  <p style={{ fontSize:13, color:"var(--secondary)", lineHeight:1.6 }}>
                    <strong style={{ color:"var(--text)" }}>Counted?</strong> — All grades including F, R, S, and M contribute to the SGPA/CGPA denominator (total credits).
                    However, credits are only <em>cleared</em> for grades O, E, A, B, C, and D.
                    Grade F carries 2 points, while R, S, M carry 0 points but still add to total credit count.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>

      {/* ── Responsive CSS ── */}
      <style>{`
        /* Default: show desktop layout */
        .gs-row-desktop { display: grid; }
        .gs-row-mobile  { display: none !important; }
        .gs-header      { display: grid; }

        @media (max-width: 620px) {
          .gs-header      { display: none !important; }
          .gs-row-desktop { display: none !important; }
          .gs-row-mobile  { display: block !important; }
        }

        /* Search bar: stack on mobile */
        @media (max-width: 560px) {
          .home-search-wrap { flex-direction: column !important; }
          .home-search-wrap input,
          .home-search-wrap button { width: 100% !important; flex: none !important; }
        }
      `}</style>

      {/* ════════════════════════════════════════════
          FOOTER SECTION
      ════════════════════════════════════════════ */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          width: "100%",
          maxWidth: 900,
          margin: "0 auto",
          marginTop: "auto",
          padding: "32px 24px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          zIndex: 1,
        }}
      >
        <p style={{ color: "var(--secondary)", fontSize: 14, fontWeight: 500 }}>
          Developed with <span style={{ color: "#ef4444" }}>♥</span> by <span style={{ color: "var(--text)", fontWeight: 700 }}>Jagan Parida</span>
        </p>
        <div style={{ display: "flex", gap: 20 }}>
          {[
            { icon: <GithubIcon size={20} />, url: "https://github.com/JaganParida", color: "#fff", label: "GitHub" },
            { icon: <LinkedinIcon size={20} />, url: "https://www.linkedin.com/in/jagan-parida04", color: "#3b82f6", label: "LinkedIn" },
            { icon: <InstagramIcon size={20} />, url: "https://instagram.com/imjagaan", color: "#ec4899", label: "Instagram" },
          ].map((link, idx) => (
            <motion.a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -3, scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--secondary)",
                transition: "all 0.3s ease",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = link.color;
                e.currentTarget.style.background = `${link.color}15`;
                e.currentTarget.style.borderColor = `${link.color}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--secondary)";
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              }}
              aria-label={link.label}
            >
              {link.icon}
            </motion.a>
          ))}
        </div>
      </motion.footer>
    </motion.div>
  );
}
