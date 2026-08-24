import React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  GraduationCap,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  BarChart2,
  CheckCircle2,
  Award,
  FileCheck,
  Zap,
  Loader2,
} from "lucide-react";

const COURSES = [
  { code: "CUTM1029", name: "Distributed Systems & Cloud", credits: 4, grade: "O", points: 10, pts: "10 Pts", color: "#b45309", bg: "#fef3c7" },
  { code: "CUTM1030", name: "Information Security & Cryptography", credits: 4, grade: "O", points: 10, pts: "10 Pts", color: "#b45309", bg: "#fef3c7" },
  { code: "CUTM1031", name: "Deep Learning & AI Foundations", credits: 4, grade: "E", points: 9, pts: "9 Pts", color: "#15803d", bg: "#dcfce7" },
  { code: "CUTM1032", name: "Full Stack Capstone Industrial Project", credits: 6, grade: "O", points: 10, pts: "10 Pts", color: "#b45309", bg: "#fef3c7" },
];

export default function HeroSection({
  hasActiveSession,
  currentRegNo,
  authChecking = false,
  onExplore,
  onLogin,
  onDashboard,
}) {
  return (
    <section
      className="gf-landing-hero"
      style={{
        position: "relative",
        paddingTop: "56px",
        paddingBottom: "48px",
        maxWidth: 1240,
        margin: "0 auto",
        paddingLeft: 24,
        paddingRight: 24,
      }}
    >
      {/* 2-Column Split Hero Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.05fr 1fr",
          gap: 48,
          alignItems: "center",
        }}
        className="gf-editorial-split"
      >
        {/* Left Column: Text, CTAs & Value Props */}
        <div>
          {/* Clean Enterprise Overline */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="gf-hero-overline"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              fontWeight: 750,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#2563eb",
              marginBottom: 16,
            }}
          >
            <GraduationCap size={15} strokeWidth={2.4} />
            <span>Centurion University &bull; 160 Credits</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
            className="gf-hero-heading"
            style={{
              fontSize: "clamp(36px, 5vw, 60px)",
              fontWeight: 850,
              lineHeight: 1.08,
              letterSpacing: "-0.038em",
              color: "#0f172a",
              margin: "0 0 20px 0",
            }}
          >
            Your academics
            <br />
            <span style={{ color: "#2563eb" }}>
              Finally made intelligent
            </span>
          </motion.h1>

          {/* Subtitle / Positioning Statement (Compressed & Punchy) */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16, ease: "easeOut" }}
            className="gf-hero-subtitle"
            style={{
              fontSize: "clamp(15px, 1.8vw, 17px)",
              lineHeight: 1.55,
              color: "#475569",
              margin: "0 0 28px 0",
              fontWeight: 450,
              maxWidth: 520,
              textWrap: "balance",
            }}
          >
            Academic intelligence for Centurion University students. Track GPA velocity, simulate target grades, evaluate 50+ company cutoffs, and access schedules with zero ERP downtime.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24, ease: "easeOut" }}
            className="gf-hero-btn-container"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
              marginBottom: 36,
            }}
          >
            {authChecking ? (
              <div
                className="gf-mobile-full-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "13px 22px",
                  borderRadius: 10,
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#2563eb",
                  fontSize: "clamp(13px, 3.2vw, 15px)",
                  fontWeight: 700,
                  cursor: "default",
                  userSelect: "none",
                }}
              >
                <Loader2 size={16} className="gf-spin" />
                <span>Verifying session...</span>
              </div>
            ) : hasActiveSession ? (
              <button
                className="gf-mobile-full-btn"
                onClick={onDashboard}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "13px 20px",
                  borderRadius: 10,
                  background: "#2563eb",
                  color: "#ffffff",
                  fontSize: "clamp(13px, 3.2vw, 15px)",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.28)",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                  flexWrap: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#1d4ed8";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(37, 99, 235, 0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#2563eb";
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(37, 99, 235, 0.28)";
                }}
              >
                <span>Continue to Dashboard</span>
                {currentRegNo && (
                  <span
                    style={{
                      fontSize: "clamp(11px, 2.7vw, 12px)",
                      fontFamily: "'Space Mono', monospace",
                      fontWeight: 700,
                      background: "rgba(255, 255, 255, 0.22)",
                      color: "#ffffff",
                      padding: "2px 7px",
                      borderRadius: 6,
                      letterSpacing: "0.02em",
                      flexShrink: 0,
                    }}
                  >
                    {currentRegNo}
                  </span>
                )}
                <ArrowRight size={15} style={{ flexShrink: 0 }} />
              </button>
            ) : (
              <>
                <button
                  className="gf-mobile-full-btn"
                  onClick={onLogin}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "14px 26px",
                    borderRadius: 10,
                    background: "#2563eb",
                    color: "#ffffff",
                    fontSize: 15,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 2px 10px rgba(37, 99, 235, 0.25)",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
                >
                  <span>Student Login</span>
                  <ArrowRight size={16} />
                </button>

                <button
                  className="gf-mobile-full-btn"
                  onClick={onExplore}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "14px 22px",
                    borderRadius: 10,
                    background: "#ffffff",
                    color: "#0f172a",
                    fontSize: 15,
                    fontWeight: 600,
                    border: "1px solid #cbd5e1",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f8fafc";
                    e.currentTarget.style.borderColor = "#94a3b8";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#ffffff";
                    e.currentTarget.style.borderColor = "#cbd5e1";
                  }}
                >
                  <span>Explore Features</span>
                  <ChevronRight size={16} color="#64748b" />
                </button>
              </>
            )}
          </motion.div>

          {/* Quick Metrics Strip (Always 1 Line on All Devices) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.32 }}
            className="gf-hero-metrics"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              whiteSpace: "nowrap",
              fontSize: "clamp(11px, 2.7vw, 12.5px)",
              color: "#64748b",
              borderTop: "1px solid #f1f5f9",
              paddingTop: 16,
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
              <CheckCircle2 size={14} color="#059669" style={{ flexShrink: 0 }} />
              <span>160 Credits</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
              <CheckCircle2 size={14} color="#059669" style={{ flexShrink: 0 }} />
              <span>50+ Cutoffs</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
              <CheckCircle2 size={14} color="#059669" style={{ flexShrink: 0 }} />
              <span>Zero Downtime</span>
            </div>
            {/* Desktop-Only Additional High-Trust Metrics */}
            <div className="gf-desktop-only" style={{ display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
              <CheckCircle2 size={14} color="#059669" style={{ flexShrink: 0 }} />
              <span>Verified Engine</span>
            </div>
            <div className="gf-desktop-only" style={{ display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
              <CheckCircle2 size={14} color="#059669" style={{ flexShrink: 0 }} />
              <span>100% Private</span>
            </div>
          </motion.div>
        </div>

        {/* Right Column: High-Performance GPU Tilted Official Report Card */}
        <div style={{ position: "relative", width: "100%", maxWidth: 490, margin: "0 auto" }}>
          {/* Ambient Glow */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "10%",
              left: "15%",
              width: "380px",
              height: "380px",
              background: "radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, rgba(255, 255, 255, 0) 70%)",
              filter: "blur(50px)",
              zIndex: 0,
              pointerEvents: "none",
            }}
          />

          {/* Floating Subtle Top Stamp Badge */}
          <div
            style={{
              position: "absolute",
              top: -14,
              right: 16,
              zIndex: 25,
              background: "#ffffff",
              border: "1px solid #bfdbfe",
              padding: "5px 12px",
              borderRadius: 999,
              boxShadow: "0 6px 16px rgba(37, 99, 235, 0.12)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11.5,
              fontWeight: 750,
              color: "#1d4ed8",
            }}
          >
            <ShieldCheck size={14} color="#2563eb" />
            <span>Verified Institutional Record</span>
          </div>

          {/* Float Wrapper Separates Continuous Animation from Hover State */}
          <div className="gf-hero-float-wrapper">
            {/* Inner Report Card with Instant CSS Hover Transition */}
            <div
              className="gf-hero-report-card"
              style={{
                position: "relative",
                zIndex: 10,
                width: "100%",
                background: "#ffffff",
                borderRadius: 14,
                border: "1px solid #cbd5e1",
                boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.14), 0 10px 20px -5px rgba(15, 23, 42, 0.08), 0 0 1px rgba(15, 23, 42, 0.18)",
                padding: "24px 26px",
                fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                cursor: "default",
                overflow: "hidden",
              }}
            >
              {/* Full Content-Cover Light Green Glass Overlay Banner */}
              <div
                className="gf-hero-overlay-banner"
                style={{
                  position: "absolute",
                  top: "43%",
                  left: "-10px",
                  width: "calc(100% + 20px)",
                  transform: "translateY(-50%) rotate(-7deg)",
                  zIndex: 20,
                  background: "rgba(236, 253, 245, 0.97)",
                  borderTop: "2px solid #34d399",
                  borderBottom: "2px solid #34d399",
                  padding: "8px 14px",
                  boxShadow: "0 8px 20px rgba(5, 150, 105, 0.16)",
                  pointerEvents: "none",
                  textAlign: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 11.5, fontWeight: 900, color: "#065f46", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                  <CheckCircle2 size={14} color="#059669" style={{ flexShrink: 0 }} />
                  <span>ALL COURSES CLEARED &bull; 100% CREDITS</span>
                </div>
                <div style={{ fontSize: 9.5, fontWeight: 750, color: "#047857", marginTop: 2, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                  DISTINCTION ACADEMIC STANDING &bull; 9.10 SGPA
                </div>
              </div>

              {/* University Document Header */}
              <div style={{ borderBottom: "2px solid #0f172a", paddingBottom: 8, marginBottom: 10, textAlign: "center" }}>
                <div style={{ fontSize: 9.5, fontWeight: 800, color: "#2563eb", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>
                  Centurion University of Technology and Management
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 850, color: "#0f172a", letterSpacing: "-0.01em" }}>
                  STATEMENT OF SEMESTER GRADES
                </div>
                <div style={{ fontSize: 10, color: "#64748b" }}>
                  Batch 2023–2027 &bull; Semester 6 Regular Examination
                </div>
              </div>

              {/* Student Details Grid with Masked XXX Registration Format */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 5,
                  padding: "8px 12px",
                  background: "#f8fafc",
                  borderRadius: 8,
                  border: "1px solid #f1f5f9",
                  fontSize: 11.5,
                  color: "#475569",
                  marginBottom: 12,
                }}
              >
                <div>Reg No: <strong style={{ color: "#0f172a", fontFamily: "'Space Mono', monospace" }}>23030112XXXX</strong></div>
                <div>Branch: <strong style={{ color: "#0f172a" }}>CSE</strong></div>
                <div>Student: <strong style={{ color: "#0f172a" }}>Demo Student</strong></div>
                <div>Credits: <strong style={{ color: "#059669" }}>18 / 18 Cr Cleared</strong></div>
              </div>

            {/* Course Ledger Table */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 800, color: "#64748b", borderBottom: "1px solid #e2e8f0", paddingBottom: 4, letterSpacing: "0.04em" }}>
                <span>COURSE CODE &bull; TITLE</span>
                <span>GRADE / POINTS</span>
              </div>

              {COURSES.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "4px 0",
                    fontSize: 11.5,
                    borderBottom: i < COURSES.length - 1 ? "1px solid #f8fafc" : "none",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 650, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 250 }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>{c.code} &bull; {c.credits} Credits</div>
                  </div>
                  <span
                    style={{
                      padding: "2px 7px",
                      borderRadius: 4,
                      background: c.bg,
                      color: c.color,
                      fontWeight: 800,
                      fontSize: 11,
                      fontFamily: "'Space Mono', monospace",
                    }}
                  >
                    {c.grade} ({c.pts})
                  </span>
                </div>
              ))}
            </div>

            {/* Key Scores & Formal Verification Footer */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 1.2fr 1fr",
                gap: 8,
                background: "#f8fafc",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                marginBottom: 10,
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>Sem 6 SGPA</div>
                <div style={{ fontSize: 16, fontWeight: 850, color: "#2563eb", fontFamily: "'Space Mono', monospace" }}>
                  9.10
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>Cumulative CGPA</div>
                <div style={{ fontSize: 16, fontWeight: 850, color: "#0f172a", fontFamily: "'Space Mono', monospace" }}>
                  8.74
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#059669", background: "#ecfdf5", padding: "3px 6px", borderRadius: 4 }}>
                  PASSED
                </span>
              </div>
            </div>

            {/* Document Bottom Seal */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 8, fontSize: 10.5, color: "#64748b" }}>
              <span>Official CUTM Grade Record</span>
              <span style={{ color: "#2563eb", fontWeight: 700 }}>Streamlined by GradeFlow</span>
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
