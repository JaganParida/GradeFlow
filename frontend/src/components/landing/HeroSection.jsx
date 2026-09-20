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
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  color: "#64748b",
                  fontSize: "clamp(13px, 3.2vw, 15px)",
                  fontWeight: 600,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                  userSelect: "none",
                }}
              >
                <Loader2 size={16} className="spin" color="#2563eb" />
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

        {/* Right Column: Ultra-Modern Academic Intelligence Hub Card */}
        <div style={{ position: "relative", width: "100%", maxWidth: 500, margin: "0 auto" }}>
          {/* Ambient Multi-Layer Glow */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "8%",
              left: "10%",
              width: "400px",
              height: "400px",
              background: "radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, rgba(99, 102, 241, 0.05) 50%, rgba(255, 255, 255, 0) 70%)",
              filter: "blur(60px)",
              zIndex: 0,
              pointerEvents: "none",
            }}
          />

          {/* Floating Top-Right Verified Record Pill */}
          <div
            className="gf-floating-badge-top"
            style={{
              position: "absolute",
              top: -14,
              right: 18,
              zIndex: 25,
              background: "#ffffff",
              border: "1px solid #bfdbfe",
              padding: "6px 14px",
              borderRadius: 999,
              boxShadow: "0 8px 20px rgba(37, 99, 235, 0.14), 0 2px 6px rgba(15, 23, 42, 0.04)",
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: 11.5,
              fontWeight: 750,
              color: "#1d4ed8",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
            <ShieldCheck size={14} color="#2563eb" strokeWidth={2.4} />
            <span>Verified Institutional Record</span>
          </div>

          {/* Floating Bottom-Left Velocity Pill */}
          <div
            className="gf-floating-badge-bottom"
            style={{
              position: "absolute",
              bottom: -12,
              left: -10,
              zIndex: 25,
              background: "#ffffff",
              border: "1px solid #bbf7d0",
              padding: "6px 14px",
              borderRadius: 999,
              boxShadow: "0 8px 22px rgba(16, 185, 129, 0.14), 0 2px 6px rgba(15, 23, 42, 0.04)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11.5,
              fontWeight: 750,
              color: "#065f46",
              whiteSpace: "nowrap",
            }}
          >
            <TrendingUp size={14} color="#059669" strokeWidth={2.5} />
            <span>+0.36 SGPA Velocity &bull; Top 5% in CSE</span>
          </div>

          {/* Float Wrapper Separates Continuous Animation from Hover State */}
          <div className="gf-hero-float-wrapper">
            <div
              className="gf-hero-report-card"
              style={{
                position: "relative",
                zIndex: 10,
                width: "100%",
                background: "#ffffff",
                borderRadius: 18,
                border: "1px solid rgba(226, 232, 240, 0.9)",
                boxShadow: "0 24px 54px -14px rgba(15, 23, 42, 0.13), 0 10px 24px -8px rgba(15, 23, 42, 0.06), 0 0 0 1px rgba(15, 23, 42, 0.03)",
                padding: "22px 24px",
                fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                cursor: "default",
                overflow: "hidden",
              }}
            >
              {/* Card Header: Institution & Semester */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: 12,
                  borderBottom: "1px solid #f1f5f9",
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                      border: "1px solid #bfdbfe",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#2563eb",
                      flexShrink: 0,
                    }}
                  >
                    <GraduationCap size={18} strokeWidth={2.4} />
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                      Centurion University
                    </div>
                    <div style={{ fontSize: 10.5, color: "#64748b", fontWeight: 500, marginTop: 1 }}>
                      Batch 2023–27 &bull; Semester 6 Regular
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: "#059669",
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    padding: "3px 8px",
                    borderRadius: 6,
                    letterSpacing: "0.02em",
                  }}
                >
                  <Award size={13} />
                  <span>STATEMENT OF GRADES</span>
                </div>
              </div>

              {/* Student Identity Bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#f8fafc",
                  borderRadius: 11,
                  padding: "9px 12px",
                  border: "1px solid #e2e8f0",
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                      color: "#ffffff",
                      fontSize: 11,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    DS
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 12, fontWeight: 750, color: "#0f172a", lineHeight: 1.2 }}>
                      Demo Student
                    </div>
                    <div style={{ fontSize: 10.5, color: "#64748b", fontFamily: "'Space Mono', monospace" }}>
                      23030112XXXX &bull; CSE
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>Degree Credits</div>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: "#059669" }}>
                    18 / 18 Cr Cleared
                  </div>
                </div>
              </div>

              {/* Distinction Standing Banner (Clean, Integrated & 100% Readable) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)",
                  border: "1px solid #bbf7d0",
                  borderRadius: 11,
                  padding: "8px 12px",
                  marginBottom: 14,
                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.06)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <CheckCircle2 size={16} color="#059669" strokeWidth={2.4} style={{ flexShrink: 0 }} />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 11.5, fontWeight: 850, color: "#065f46", letterSpacing: "0.01em" }}>
                      All Courses Cleared &bull; 100% Credits
                    </div>
                    <div style={{ fontSize: 10, color: "#047857", fontWeight: 600 }}>
                      Distinction Standing &bull; Top 5% Department Rank
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 850,
                    color: "#ffffff",
                    background: "#059669",
                    padding: "3px 8px",
                    borderRadius: 6,
                    letterSpacing: "0.04em",
                  }}
                >
                  PASSED
                </span>
              </div>

              {/* Course Ledger (Crystal Clear Typography, Zero Text Obscurity) */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 10,
                    fontWeight: 800,
                    color: "#64748b",
                    padding: "0 4px 4px 4px",
                    borderBottom: "1px solid #f1f5f9",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  <span>Course Code &bull; Title</span>
                  <span>Grade / Points</span>
                </div>

                {COURSES.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "7px 10px",
                      borderRadius: 8,
                      background: "#fcfdfe",
                      border: "1px solid #f1f5f9",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f8fafc";
                      e.currentTarget.style.borderColor = "#e2e8f0";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#fcfdfe";
                      e.currentTarget.style.borderColor = "#f1f5f9";
                    }}
                  >
                    <div style={{ textAlign: "left", minWidth: 0, flex: 1, paddingRight: 8 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 12,
                          color: "#0f172a",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {c.name}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>
                        <span style={{ fontFamily: "'Space Mono', monospace" }}>{c.code}</span> &bull; {c.credits} Credits
                      </div>
                    </div>

                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: c.bg,
                        color: c.color,
                        fontWeight: 800,
                        fontSize: 11,
                        fontFamily: "'Space Mono', monospace",
                        flexShrink: 0,
                        border: `1px solid ${c.color}25`,
                      }}
                    >
                      {c.grade} ({c.pts})
                    </span>
                  </div>
                ))}
              </div>

              {/* Dual Stat Metrics Cards: SGPA & Cumulative CGPA with Trend Indicator */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                {/* SGPA Tile */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)",
                    border: "1px solid #dbeafe",
                    borderRadius: 12,
                    padding: "9px 12px",
                    textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      Sem 6 SGPA
                    </span>
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 800,
                        color: "#15803d",
                        background: "#dcfce7",
                        padding: "1px 5px",
                        borderRadius: 4,
                      }}
                    >
                      +0.36 ▲
                    </span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#2563eb", fontFamily: "'Space Mono', monospace", lineHeight: 1.2, marginTop: 3 }}>
                    9.10
                  </div>
                </div>

                {/* CGPA Tile */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: "9px 12px",
                    textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      Overall CGPA
                    </span>
                    <span
                      style={{
                        fontSize: 9.5,
                        fontWeight: 800,
                        color: "#2563eb",
                        background: "#eff6ff",
                        padding: "1px 5px",
                        borderRadius: 4,
                      }}
                    >
                      87.4%
                    </span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", fontFamily: "'Space Mono', monospace", lineHeight: 1.2, marginTop: 3 }}>
                    8.74
                  </div>
                </div>
              </div>

              {/* Bottom Footer Seal */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px solid #f1f5f9",
                  paddingTop: 8,
                  fontSize: 10.5,
                  color: "#64748b",
                }}
              >
                <span>Official CUTM Grade Record</span>
                <span style={{ color: "#2563eb", fontWeight: 750 }}>Streamlined by GradeFlow</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
