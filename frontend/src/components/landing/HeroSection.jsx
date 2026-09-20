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
  { sem: 1, sgpa: 8.20, cgpa: 8.20, credits: 22, height: 50, label: "Sem 1" },
  { sem: 2, sgpa: 8.45, cgpa: 8.32, credits: 24, height: 60, label: "Sem 2" },
  { sem: 3, sgpa: 8.50, cgpa: 8.38, credits: 26, height: 65, label: "Sem 3" },
  { sem: 4, sgpa: 8.65, cgpa: 8.45, credits: 24, height: 75, label: "Sem 4" },
  { sem: 5, sgpa: 8.74, cgpa: 8.52, credits: 22, height: 82, label: "Sem 5" },
  { sem: 6, sgpa: 9.10, cgpa: 8.74, credits: 18, height: 100, label: "Sem 6" },
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

        {/* Right Column: Sleek Compact Animated Academic Intelligence Cockpit */}
        <div style={{ position: "relative", width: "100%", maxWidth: 440, margin: "0 auto" }}>
          {/* Ambient Multi-Layer Radial Glow */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: "5%",
              left: "10%",
              width: "360px",
              height: "360px",
              background: "radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, rgba(99, 102, 241, 0.05) 50%, rgba(255, 255, 255, 0) 70%)",
              filter: "blur(50px)",
              zIndex: 0,
              pointerEvents: "none",
            }}
          />

          {/* Floating Top-Right Verified Record Pill (SVG Only, No Emojis) */}
          <div
            className="gf-floating-badge-top"
            style={{
              position: "absolute",
              top: -12,
              right: 14,
              zIndex: 25,
              background: "#ffffff",
              border: "1px solid #bfdbfe",
              padding: "5px 12px",
              borderRadius: 999,
              boxShadow: "0 6px 18px rgba(37, 99, 235, 0.12), 0 2px 6px rgba(15, 23, 42, 0.04)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              fontWeight: 750,
              color: "#1d4ed8",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
            <ShieldCheck size={13} color="#2563eb" strokeWidth={2.4} />
            <span>Verified Record</span>
          </div>

          {/* Floating Bottom-Left Velocity Pill (SVG Only, No Emojis) */}
          <div
            className="gf-floating-badge-bottom"
            style={{
              position: "absolute",
              bottom: -10,
              left: -8,
              zIndex: 25,
              background: "#ffffff",
              border: "1px solid #bbf7d0",
              padding: "5px 12px",
              borderRadius: 999,
              boxShadow: "0 6px 18px rgba(16, 185, 129, 0.12), 0 2px 6px rgba(15, 23, 42, 0.04)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              fontWeight: 750,
              color: "#065f46",
              whiteSpace: "nowrap",
            }}
          >
            <TrendingUp size={13} color="#059669" strokeWidth={2.5} />
            <span>+0.36 SGPA Velocity &bull; Top 5%</span>
          </div>

          {/* Float Wrapper */}
          <div className="gf-hero-float-wrapper">
            <div
              className="gf-hero-report-card"
              style={{
                position: "relative",
                zIndex: 10,
                width: "100%",
                background: "#ffffff",
                borderRadius: 18,
                border: "1px solid rgba(226, 232, 240, 0.95)",
                boxShadow: "0 20px 48px -12px rgba(15, 23, 42, 0.11), 0 8px 20px -6px rgba(15, 23, 42, 0.05), 0 0 0 1px rgba(15, 23, 42, 0.02)",
                padding: "20px 22px",
                fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                cursor: "default",
              }}
            >
              {/* Card Header: Institutional Branding & Live Sync Beacon */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: 14,
                  borderBottom: "1px solid #f1f5f9",
                  marginBottom: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
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
                    <GraduationCap size={17} strokeWidth={2.4} />
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                      Centurion University
                    </div>
                    <div style={{ fontSize: 10.5, color: "#64748b", fontWeight: 500, marginTop: 1 }}>
                      B.Tech CSE &bull; Batch 2023–27
                    </div>
                  </div>
                </div>

                {/* Animated Live Sync Indicator */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: "#065f46",
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    padding: "3px 8px",
                    borderRadius: 6,
                  }}
                >
                  <motion.span
                    animate={{ scale: [1, 1.35, 1], opacity: [1, 0.6, 1] }}
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
                  <span>Live Engine</span>
                </div>
              </div>

              {/* Active Semester Metric Display & Trend Pill */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)",
                  border: "1px solid #dbeafe",
                  borderRadius: 14,
                  padding: "12px 14px",
                  marginBottom: 14,
                }}
              >
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 10, fontWeight: 750, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {activeSem.label} SGPA
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 2 }}>
                    <span
                      style={{
                        fontSize: 26,
                        fontWeight: 900,
                        color: "#0f172a",
                        fontFamily: "'Space Mono', monospace",
                        lineHeight: 1,
                      }}
                    >
                      {activeSem.sgpa.toFixed(2)}
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        fontSize: 10,
                        fontWeight: 800,
                        color: "#15803d",
                        background: "#dcfce7",
                        padding: "2px 6px",
                        borderRadius: 5,
                      }}
                    >
                      <TrendingUp size={11} strokeWidth={2.8} />
                      <span>{activeSem.sem === 6 ? "+0.36" : "+0.12"}</span>
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, fontWeight: 750, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Cumulative CGPA
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      color: "#2563eb",
                      fontFamily: "'Space Mono', monospace",
                      marginTop: 2,
                    }}
                  >
                    {activeSem.cgpa.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 10, color: "#059669", fontWeight: 700, marginTop: 1 }}>
                    {activeSem.credits} Cr Cleared
                  </div>
                </div>
              </div>

              {/* Interactive 6-Semester Progression Sparkline / Bar Graph */}
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 10.5,
                    fontWeight: 750,
                    color: "#64748b",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  <span>Progression (Sem 1 – 6)</span>
                  <span style={{ color: "#2563eb", fontWeight: 800, textTransform: "none" }}>
                    Tap bar to switch
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(6, 1fr)",
                    gap: 6,
                    height: 62,
                    alignItems: "end",
                    background: "#f8fafc",
                    padding: "8px 10px 4px 10px",
                    borderRadius: 12,
                    border: "1px solid #f1f5f9",
                  }}
                >
                  {SEMESTERS.map((s, idx) => {
                    const isSelected = activeSemIndex === idx;
                    return (
                      <button
                        key={s.sem}
                        type="button"
                        onClick={() => setActiveSemIndex(idx)}
                        onMouseEnter={() => setActiveSemIndex(idx)}
                        style={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "flex-end",
                          alignItems: "center",
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          outline: "none",
                        }}
                      >
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${s.height}%` }}
                          transition={{ duration: 0.5, delay: idx * 0.06, ease: "easeOut" }}
                          style={{
                            width: "100%",
                            borderRadius: 4,
                            background: isSelected
                              ? "linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)"
                              : "linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%)",
                            boxShadow: isSelected ? "0 2px 8px rgba(37, 99, 235, 0.4)" : "none",
                            transition: "background 0.15s ease, box-shadow 0.15s ease",
                          }}
                        />
                        <span
                          style={{
                            fontSize: 9.5,
                            fontWeight: isSelected ? 800 : 600,
                            color: isSelected ? "#2563eb" : "#94a3b8",
                            marginTop: 3,
                            fontFamily: "'Space Mono', monospace",
                          }}
                        >
                          S{s.sem}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Target GPA Simulator Slider (Clean 2 Lines) */}
              <div
                style={{
                  background: "#fcfdfe",
                  border: "1px solid #f1f5f9",
                  borderRadius: 12,
                  padding: "10px 12px",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 800, color: "#0f172a" }}>
                    <Zap size={13} color="#2563eb" strokeWidth={2.6} />
                    <span>Simulate Sem 7 Target</span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 850,
                      color: "#2563eb",
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      padding: "1px 6px",
                      borderRadius: 5,
                      fontFamily: "'Space Mono', monospace",
                    }}
                  >
                    {targetSimGpa.toFixed(2)} SGPA
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
                    height: 7,
                    background: `linear-gradient(to right, #2563eb 0%, #2563eb ${Math.max(0, Math.min(100, ((targetSimGpa - 8.5) / (10.0 - 8.5)) * 100))}%, #e2e8f0 ${Math.max(0, Math.min(100, ((targetSimGpa - 8.5) / (10.0 - 8.5)) * 100))}%, #e2e8f0 100%)`,
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 7,
                    fontSize: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#065f46", fontWeight: 700 }}>
                    <CheckCircle2 size={12} color="#059669" strokeWidth={2.5} />
                    <span>{targetSimGpa >= 9.0 ? "50/50 Placement Cutoffs Unlocked" : "44/50 Placement Cutoffs Unlocked"}</span>
                  </div>
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 800,
                      color: targetSimGpa >= 9.0 ? "#059669" : "#2563eb",
                      background: targetSimGpa >= 9.0 ? "#ecfdf5" : "#eff6ff",
                      border: `1px solid ${targetSimGpa >= 9.0 ? "#a7f3d0" : "#bfdbfe"}`,
                      padding: "1px 6px",
                      borderRadius: 4,
                    }}
                  >
                    {targetSimGpa >= 9.0 ? "Tier 1 Elite" : "Core Tech"}
                  </span>
                </div>
              </div>

              {/* Bottom Compact Trust Row: SVGs Only, No Emojis */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderTop: "1px solid #f1f5f9",
                  paddingTop: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "#64748b", fontWeight: 650 }}>
                  <FileCheck size={13} color="#2563eb" strokeWidth={2.4} />
                  <span>160 Cr Degree</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "#64748b", fontWeight: 650 }}>
                  <Award size={13} color="#059669" strokeWidth={2.4} />
                  <span>Top 5% Rank</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "#64748b", fontWeight: 650 }}>
                  <Sparkles size={13} color="#2563eb" strokeWidth={2.4} />
                  <span>0s Downtime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
