import React, { useState } from "react";
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
  Sparkles,
  Loader2,
} from "lucide-react";

const SEMESTERS = [
  { sem: 1, sgpa: 8.20, cgpa: 8.20, credits: 22, x: 24, y: 62, label: "Sem 1" },
  { sem: 2, sgpa: 8.45, cgpa: 8.32, credits: 24, x: 88, y: 50, label: "Sem 2" },
  { sem: 3, sgpa: 8.50, cgpa: 8.38, credits: 26, x: 152, y: 47, label: "Sem 3" },
  { sem: 4, sgpa: 8.65, cgpa: 8.45, credits: 24, x: 216, y: 40, label: "Sem 4" },
  { sem: 5, sgpa: 8.74, cgpa: 8.52, credits: 22, x: 280, y: 35, label: "Sem 5" },
  { sem: 6, sgpa: 9.10, cgpa: 8.74, credits: 18, x: 344, y: 18, label: "Sem 6" },
];

export default function HeroSection({
  hasActiveSession,
  currentRegNo,
  authChecking = false,
  onExplore,
  onLogin,
  onDashboard,
}) {
  const [activeSemIndex, setActiveSemIndex] = useState(5);
  const [targetSimGpa, setTargetSimGpa] = useState(9.30);
  const activeSem = SEMESTERS[activeSemIndex];
  const prevSgpa = activeSemIndex > 0 ? SEMESTERS[activeSemIndex - 1].sgpa : 8.00;
  const diff = activeSem.sgpa - prevSgpa;
  const velocityText = `${diff >= 0 ? "+" : ""}${diff.toFixed(2)}`;
  const projectedCgpa = ((1083.76 + targetSimGpa * 18) / 142).toFixed(2);
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

        {/* Right Column: Clean Big-Tech Academic Cockpit (Non-Bulky, SVG Curve, Google/Stripe Grade) */}
        <div style={{ position: "relative", width: "100%", maxWidth: 440, margin: "0 auto" }}>
          {/* Subtle Ambient Radial Glow */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "6%",
              left: "12%",
              width: "320px",
              height: "320px",
              background: "radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, rgba(99, 102, 241, 0.03) 50%, rgba(255, 255, 255, 0) 70%)",
              filter: "blur(44px)",
              zIndex: 0,
              pointerEvents: "none",
            }}
          />

          <div className="gf-hero-float-wrapper">
            <div
              className="gf-hero-report-card"
              style={{
                position: "relative",
                zIndex: 10,
                width: "100%",
                background: "#ffffff",
                borderRadius: 18,
                border: "1px solid #e2e8f0",
                boxShadow: "0 20px 48px -12px rgba(15, 23, 42, 0.08), 0 6px 18px -4px rgba(15, 23, 42, 0.04), 0 0 0 1px rgba(15, 23, 42, 0.02)",
                padding: "22px 24px",
                fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                cursor: "default",
              }}
            >
              {/* Card Header: Institutional Identity & Live Record Pill */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: 14,
                  borderBottom: "1px solid #f1f5f9",
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
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
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                      Centurion University
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginTop: 1 }}>
                      B.Tech CSE &bull; Batch 2023–27
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 750,
                    color: "#065f46",
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    padding: "4px 9px",
                    borderRadius: 999,
                  }}
                >
                  <motion.span
                    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#10b981",
                      display: "inline-block",
                      boxShadow: "0 0 6px #10b981",
                    }}
                  />
                  <ShieldCheck size={13} color="#059669" strokeWidth={2.5} />
                  <span>Verified Record</span>
                </div>
              </div>

              {/* Primary Metric Section (Open & Seamless, No Nested Gray Box) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  marginBottom: 16,
                  paddingTop: 2,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 750,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 4,
                    }}
                  >
                    {activeSem.label} Performance
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 32,
                        fontWeight: 850,
                        color: "#0f172a",
                        fontFamily: "'Space Mono', monospace",
                        lineHeight: 1,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {activeSem.sgpa.toFixed(2)}
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        fontSize: 10.5,
                        fontWeight: 750,
                        color: "#15803d",
                        background: "#ecfdf5",
                        border: "1px solid #bbf7d0",
                        padding: "2px 7px",
                        borderRadius: 6,
                      }}
                    >
                      <TrendingUp size={11} strokeWidth={2.8} />
                      <span>{activeSemIndex === 0 ? "Baseline" : `${velocityText} SGPA`}</span>
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 750,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 3,
                    }}
                  >
                    Overall CGPA
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 850,
                      color: "#2563eb",
                      fontFamily: "'Space Mono', monospace",
                      lineHeight: 1.1,
                    }}
                  >
                    {activeSem.cgpa.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginTop: 2 }}>
                    {activeSem.credits} Cr Cleared
                  </div>
                </div>
              </div>

              {/* Fluid SVG Trajectory Spline Wave (Replaces Chunky Rectangular Buttons) */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 750,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Semester Progression
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "#2563eb",
                      fontWeight: 650,
                    }}
                  >
                    Interactive Curve
                  </span>
                </div>

                <div
                  style={{
                    width: "100%",
                    background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
                    borderRadius: 12,
                    border: "1px solid #f1f5f9",
                    padding: "10px 8px 6px 8px",
                  }}
                >
                  <svg
                    viewBox="0 0 368 96"
                    style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
                  >
                    <defs>
                      <linearGradient id="gfTrajectoryGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0.00" />
                      </linearGradient>
                    </defs>

                    {/* Baseline reference line */}
                    <line x1="20" y1="76" x2="348" y2="76" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />

                    {/* Smooth gradient area beneath spline */}
                    <path
                      d="M 24 62 C 56 62, 56 50, 88 50 C 120 50, 120 47, 152 47 C 184 47, 184 40, 216 40 C 248 40, 248 35, 280 35 C 312 35, 312 18, 344 18 L 344 76 L 24 76 Z"
                      fill="url(#gfTrajectoryGradient)"
                    />

                    {/* Smooth stroke spline */}
                    <path
                      d="M 24 62 C 56 62, 56 50, 88 50 C 120 50, 120 47, 152 47 C 184 47, 184 40, 216 40 C 248 40, 248 35, 280 35 C 312 35, 312 18, 344 18"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Interactive semester node dots */}
                    {SEMESTERS.map((s, idx) => {
                      const isSelected = activeSemIndex === idx;
                      return (
                        <g
                          key={s.sem}
                          onClick={() => setActiveSemIndex(idx)}
                          onMouseEnter={() => setActiveSemIndex(idx)}
                          style={{ cursor: "pointer", outline: "none" }}
                          role="button"
                          tabIndex={0}
                          aria-label={`Semester ${s.sem} SGPA ${s.sgpa.toFixed(2)}`}
                        >
                          {/* Extended invisible hit target for effortless tapping/hovering */}
                          <circle cx={s.x} cy={s.y} r="18" fill="transparent" />

                          {/* Active glowing ring or quiet dot */}
                          {isSelected ? (
                            <>
                              <circle cx={s.x} cy={s.y} r="9" fill="rgba(37, 99, 235, 0.18)" />
                              <circle cx={s.x} cy={s.y} r="5.5" fill="#ffffff" stroke="#2563eb" strokeWidth="2.5" />
                              <circle cx={s.x} cy={s.y} r="2.5" fill="#2563eb" />
                            </>
                          ) : (
                            <circle
                              cx={s.x}
                              cy={s.y}
                              r="4"
                              fill="#ffffff"
                              stroke="#94a3b8"
                              strokeWidth="2"
                              style={{ transition: "all 0.15s ease" }}
                            />
                          )}

                          {/* Semester Labels aligned underneath */}
                          <text
                            x={s.x}
                            y="91"
                            textAnchor="middle"
                            fill={isSelected ? "#2563eb" : "#64748b"}
                            fontSize="10"
                            fontWeight={isSelected ? "800" : "600"}
                            fontFamily="'Space Mono', monospace"
                          >
                            S{s.sem}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Target GPA Simulator (Google Material 3 slider, integrated, not bulky) */}
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #f1f5f9",
                  borderRadius: 12,
                  padding: "12px 14px",
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 750, color: "#0f172a" }}>
                    <Zap size={14} color="#2563eb" strokeWidth={2.5} />
                    <span>Simulate Sem 7 Target</span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#2563eb",
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontFamily: "'Space Mono', monospace",
                    }}
                  >
                    {targetSimGpa.toFixed(2)} SGPA &bull; {projectedCgpa} Projected
                  </span>
                </div>

                <input
                  type="range"
                  min="8.5"
                  max="10.0"
                  step="0.05"
                  value={targetSimGpa}
                  onChange={(e) => setTargetSimGpa(parseFloat(e.target.value))}
                  style={{
                    width: "100%",
                    height: 4,
                    background: `linear-gradient(to right, #2563eb 0%, #2563eb ${Math.max(0, Math.min(100, ((targetSimGpa - 8.5) / (10.0 - 8.5)) * 100))}%, #dadce0 ${Math.max(0, Math.min(100, ((targetSimGpa - 8.5) / (10.0 - 8.5)) * 100))}%, #dadce0 100%)`,
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 8,
                    fontSize: 10.5,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#065f46", fontWeight: 700 }}>
                    <CheckCircle2 size={13} color="#059669" strokeWidth={2.5} />
                    <span>{targetSimGpa >= 9.0 ? "50/50 Placement Cutoffs Unlocked" : "44/50 Placement Cutoffs Unlocked"}</span>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: targetSimGpa >= 9.0 ? "#059669" : "#2563eb",
                      background: targetSimGpa >= 9.0 ? "#ecfdf5" : "#eff6ff",
                      border: `1px solid ${targetSimGpa >= 9.0 ? "#a7f3d0" : "#bfdbfe"}`,
                      padding: "1px 7px",
                      borderRadius: 4,
                    }}
                  >
                    {targetSimGpa >= 9.0 ? "Tier 1 Elite" : "Core Tech"}
                  </span>
                </div>
              </div>

              {/* Bottom Trust Line (SVGs Only, No Emojis) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderTop: "1px solid #f1f5f9",
                  paddingTop: 10,
                  fontSize: 11,
                  color: "#64748b",
                  fontWeight: 650,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <FileCheck size={13} color="#2563eb" strokeWidth={2.4} />
                  <span>160 Cr Degree</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Award size={13} color="#059669" strokeWidth={2.4} />
                  <span>Top 5% Rank</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Sparkles size={13} color="#2563eb" strokeWidth={2.4} />
                  <span>Zero Downtime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
