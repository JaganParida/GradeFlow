import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, ArrowRight, AlertTriangle, BarChart2, Trophy, TrendingUp, Target, Sparkles, FileText } from "lucide-react";

export default function Home() {
  const [regNo, setRegNo] = useState("");
  const { fetchStudent, loading, error } = useApp();
  const navigate = useNavigate();

  async function handleSearch(e) {
    e.preventDefault();
    if (loading) return;
    if (!regNo.trim()) return;
    
    const searchRegNo = regNo.trim();
    const success = await fetchStudent(searchRegNo);
    if (success) {
      navigate(`/dashboard/${searchRegNo}`);
    }
  }

  const isSearchDisabled = loading;

  const features = [
    { label: "SGPA & CGPA", icon: <BarChart2 size={14} /> },
    { label: "Rankings", icon: <Trophy size={14} /> },
    { label: "Analytics", icon: <TrendingUp size={14} /> },
    { label: "Backlogs", icon: <Target size={14} /> },
    { label: "AI Insights", icon: <Sparkles size={14} /> },
    { label: "Grade Sheet", icon: <FileText size={14} /> },
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
          maxWidth: 800,
          position: "relative",
          zIndex: 1,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
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
          Track Your Academic{" "}
          <span
            style={{
              background: "linear-gradient(135deg, var(--accent), #a855f7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              display: "inline-block"
            }}
          >
            Journey
          </span>
        </h1>

        <p
          style={{
            color: "var(--secondary)",
            fontSize: 18,
            marginBottom: 48,
            lineHeight: 1.7,
            maxWidth: 800,
            margin: "0 auto 48px auto",
          }}
        >
          View your grades, SGPA, CGPA, rankings, analytics, and academic
          insights — all in one place.
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ width: "100%" }}>
          <div className="search-bar-container">
            <input
              className="search-bar-input"
              value={regNo}
              onChange={(e) => setRegNo(e.target.value)}
              placeholder="Registration No. (e.g. 230301120170)"
              style={{ 
                flex: 1, 
                fontSize: 16, 
                padding: "16px 24px", 
                borderRadius: 16, 
                background: "rgba(30, 30, 30, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)",
                color: "var(--text)",
                outline: "none",
                transition: "all 0.2s"
              }}
              onFocus={(e) => e.target.style.border = "1px solid var(--accent)"}
              onBlur={(e) => e.target.style.border = "1px solid rgba(255, 255, 255, 0.08)"}
              disabled={isSearchDisabled}
            />
            <motion.button
              whileHover={isSearchDisabled ? {} : { scale: 1.02 }}
              whileTap={isSearchDisabled ? {} : { scale: 0.98 }}
              type="submit"
              disabled={isSearchDisabled}
              style={{
                background: isSearchDisabled ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, var(--accent), #3b82f6)",
                border: "none",
                padding: "16px 32px",
                borderRadius: 16,
                color: isSearchDisabled ? "rgba(255,255,255,0.3)" : "#fff",
                fontWeight: 700,
                fontSize: 16,
                cursor: isSearchDisabled ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s",
                boxShadow: isSearchDisabled ? "none" : "0 4px 15px rgba(62,166,255,0.3)",
              }}
            >
              {loading ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} />
                  </motion.div>
                  Searching...
                </>
              ) : (
                <>
                  Search <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </div>
        </form>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                marginTop: 24,
                padding: "16px 20px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: 12,
                color: "var(--danger)",
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 14,
                maxWidth: 400,
                margin: "24px auto 0",
              }}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <div style={{ textAlign: "left", lineHeight: 1.4 }}>{error}</div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Features Chips */}
        <div style={{ 
          display: "flex", 
          flexWrap: "wrap", 
          gap: 12, 
          justifyContent: "center", 
          marginTop: 60,
          maxWidth: 600,
          margin: "60px auto 0"
        }}>
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 20,
                fontSize: 13,
                color: "var(--secondary)",
              }}
            >
              <span style={{ color: "var(--accent)" }}>{feature.icon}</span>
              {feature.label}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
