import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  GraduationCap,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Award,
  FileCheck,
  Zap,
  Sparkles,
  Loader2,
  Briefcase,
  CalendarCheck,
  Target,
  AlertTriangle,
} from "lucide-react";

export default function HeroSection({
  hasActiveSession,
  currentRegNo,
  authChecking = false,
  onExplore,
  onLogin,
  onDashboard,
}) {
  const [activeTab, setActiveTab] = useState("placement"); // "placement" | "bunk" | "target"
  const [simCgpa, setSimCgpa] = useState(8.45);
  const [missCount, setMissCount] = useState(1);
  const [goalCgpa, setGoalCgpa] = useState(8.65);

  // Dynamic Placement Eligibility
  const eligibleCount = simCgpa >= 8.5 ? 48 : simCgpa >= 8.0 ? 42 : simCgpa >= 7.5 ? 36 : simCgpa >= 7.0 ? 28 : 18;

  // Dynamic Attendance Guard (20/24 base = 83.3%)
  const projAtt = ((20 / (24 + missCount)) * 100).toFixed(1);
  const isSafe = parseFloat(projAtt) >= 75.0;
  const safeRemaining = Math.max(0, 2 - missCount);

  // Dynamic Target SGPA (124 credits @ 8.40 CGPA = 1041.6, 36 remaining out of 160)
  const reqSgpa = Math.min(10.0, Math.max(0, (goalCgpa * 160 - 1041.6) / 36)).toFixed(2);
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

        {/* Right Column: Interactive Big-Tech Academic OS Studio (No Report Card, Pure Utility Playground) */}
        <div style={{ position: "relative", width: "100%", maxWidth: 450, margin: "0 auto" }}>
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
                padding: "18px 20px 16px 20px",
                fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                cursor: "default",
              }}
            >
              {/* Studio Window Titlebar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: 12,
                  borderBottom: "1px solid #f1f5f9",
                  marginBottom: 14,
                }}
              >
                {/* 3 Unix Window Dots */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#fca5a5", display: "inline-block" }} />
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#fcd34d", display: "inline-block" }} />
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#86efac", display: "inline-block" }} />
                  <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginLeft: 4 }}>
                    academic-os
                  </span>
                </div>

                {/* Institutional Badge */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 10.5,
                    fontWeight: 750,
                    color: "#065f46",
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    padding: "3px 8px",
                    borderRadius: 999,
                  }}
                >
                  <motion.span
                    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "#10b981",
                      display: "inline-block",
                      boxShadow: "0 0 5px #10b981",
                    }}
                  />
                  <span>CUTM Live Engine</span>
                </div>
              </div>

              {/* Segmented Mode Selector (Linear / Google Cloud inspired) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 4,
                  background: "#f1f5f9",
                  padding: 3,
                  borderRadius: 10,
                  marginBottom: 14,
                }}
              >
                {[
                  { id: "placement", label: "Placement", icon: Briefcase },
                  { id: "bunk", label: "Bunk Guard", icon: CalendarCheck },
                  { id: "target", label: "Target SGPA", icon: Target },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 5,
                        padding: "7px 4px",
                        borderRadius: 7,
                        border: "none",
                        background: isActive ? "#ffffff" : "transparent",
                        color: isActive ? "#2563eb" : "#64748b",
                        fontSize: 11,
                        fontWeight: isActive ? 750 : 600,
                        cursor: "pointer",
                        boxShadow: isActive ? "0 2px 6px rgba(15, 23, 42, 0.08)" : "none",
                        transition: "all 0.15s ease",
                        outline: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Icon size={12} strokeWidth={isActive ? 2.5 : 2} color={isActive ? "#2563eb" : "#64748b"} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Interactive Body */}
              <div style={{ minHeight: 215 }}>
                {activeTab === "placement" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 750, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Simulate Target CGPA
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#2563eb",
                          background: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          padding: "1px 7px",
                          borderRadius: 5,
                          fontFamily: "'Space Mono', monospace",
                        }}
                      >
                        {simCgpa.toFixed(2)} CGPA
                      </span>
                    </div>

                    <input
                      type="range"
                      min="6.5"
                      max="9.5"
                      step="0.05"
                      value={simCgpa}
                      onChange={(e) => setSimCgpa(parseFloat(e.target.value))}
                      style={{
                        width: "100%",
                        height: 4,
                        background: `linear-gradient(to right, #2563eb 0%, #2563eb ${Math.max(0, Math.min(100, ((simCgpa - 6.5) / (9.5 - 6.5)) * 100))}%, #dadce0 ${Math.max(0, Math.min(100, ((simCgpa - 6.5) / (9.5 - 6.5)) * 100))}%, #dadce0 100%)`,
                        marginBottom: 12,
                      }}
                    />

                    {/* Company Cutoff Matrix */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                      {[
                        { company: "Amazon / Microsoft", cutoff: 8.50, package: "Tier 1 • 44 LPA" },
                        { company: "TCS Digital / Infosys SP", cutoff: 7.50, package: "Core Tech • 9 LPA" },
                        { company: "Cognizant / Wipro Turbo", cutoff: 6.50, package: "Mass Tech • 6.5 LPA" },
                      ].map((c) => {
                        const isEligible = simCgpa >= c.cutoff;
                        const diff = (c.cutoff - simCgpa).toFixed(2);
                        return (
                          <div
                            key={c.company}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "7px 9px",
                              borderRadius: 8,
                              background: isEligible ? "#f0fdf4" : "#f8fafc",
                              border: `1px solid ${isEligible ? "#bbf7d0" : "#e2e8f0"}`,
                              transition: "all 0.15s ease",
                            }}
                          >
                            <div>
                              <div style={{ fontSize: 11.5, fontWeight: 750, color: "#0f172a" }}>{c.company}</div>
                              <div style={{ fontSize: 9.5, color: "#64748b" }}>{c.package} &bull; Cutoff {c.cutoff.toFixed(2)}</div>
                            </div>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                                fontSize: 10,
                                fontWeight: 750,
                                color: isEligible ? "#15803d" : "#b45309",
                                background: isEligible ? "#dcfce7" : "#fef3c7",
                                border: `1px solid ${isEligible ? "#86efac" : "#fde68a"}`,
                                padding: "2px 6px",
                                borderRadius: 5,
                              }}
                            >
                              {isEligible && <CheckCircle2 size={10} strokeWidth={2.6} />}
                              <span>{isEligible ? "Eligible" : `Need +${diff}`}</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary Bar */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#f8fafc",
                        border: "1px solid #f1f5f9",
                        padding: "7px 10px",
                        borderRadius: 7,
                        fontSize: 10.5,
                        color: "#0f172a",
                        fontWeight: 700,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Zap size={12} color="#2563eb" strokeWidth={2.4} />
                        <span>{eligibleCount} / 50 Companies Unlocked</span>
                      </div>
                      <span style={{ fontSize: 10, color: "#059669", fontWeight: 750 }}>
                        {simCgpa >= 8.5 ? "Top 5% Tier" : simCgpa >= 7.5 ? "Core Tech" : "Eligible"}
                      </span>
                    </div>
                  </div>
                )}

                {activeTab === "bunk" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 750, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          Operating Systems
                        </span>
                        <div style={{ fontSize: 11, color: "#0f172a", fontWeight: 700 }}>
                          20 / 24 Attended (83.3% Base)
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: isSafe ? "#059669" : "#dc2626",
                          background: isSafe ? "#ecfdf5" : "#fef2f2",
                          border: `1px solid ${isSafe ? "#a7f3d0" : "#fecaca"}`,
                          padding: "2px 7px",
                          borderRadius: 5,
                          fontFamily: "'Space Mono', monospace",
                        }}
                      >
                        {projAtt}% Projected
                      </span>
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#64748b", marginBottom: 3 }}>
                        <span>Simulate Classes to Miss:</span>
                        <span style={{ fontWeight: 750, color: "#0f172a" }}>{missCount} {missCount === 1 ? "Class" : "Classes"}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="1"
                        value={missCount}
                        onChange={(e) => setMissCount(parseInt(e.target.value, 10))}
                        style={{
                          width: "100%",
                          height: 4,
                          background: `linear-gradient(to right, #2563eb 0%, #2563eb ${(missCount / 5) * 100}%, #dadce0 ${(missCount / 5) * 100}%, #dadce0 100%)`,
                        }}
                      />
                    </div>

                    {/* Verdict Banner */}
                    <div
                      style={{
                        padding: "9px 11px",
                        borderRadius: 9,
                        background: isSafe ? "#f0fdf4" : "#fef2f2",
                        border: `1px solid ${isSafe ? "#bbf7d0" : "#fecaca"}`,
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 750, color: isSafe ? "#15803d" : "#b91c1c" }}>
                        {isSafe ? <CheckCircle2 size={14} strokeWidth={2.5} /> : <AlertTriangle size={14} strokeWidth={2.5} />}
                        <span>{isSafe ? "Safe Zone (Above 75% CUTM Bar)" : "Attendance Risk Alert"}</span>
                      </div>
                      <div style={{ fontSize: 10, color: isSafe ? "#166534" : "#991b1b", marginTop: 2, lineHeight: 1.35 }}>
                        {isSafe
                          ? `Safe to miss ${missCount} class${missCount === 1 ? "" : "es"}. ${safeRemaining} more safe bunk${safeRemaining === 1 ? "" : "s"} allowed.`
                          : "Missing this many classes drops you below Centurion University's 75% exam bar."}
                      </div>
                    </div>

                    {/* Quick Subject Chips */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 5,
                        textAlign: "center",
                        fontSize: 9.5,
                        color: "#64748b",
                      }}
                    >
                      <div style={{ background: "#f8fafc", border: "1px solid #f1f5f9", padding: "5px 3px", borderRadius: 6 }}>
                        <div style={{ color: "#0f172a", fontWeight: 750 }}>DBMS</div>
                        <div style={{ color: "#059669", fontWeight: 800 }}>88.2% &bull; Safe</div>
                      </div>
                      <div style={{ background: "#f8fafc", border: "1px solid #f1f5f9", padding: "5px 3px", borderRadius: 6 }}>
                        <div style={{ color: "#0f172a", fontWeight: 750 }}>Networks</div>
                        <div style={{ color: "#059669", fontWeight: 800 }}>81.0% &bull; Safe</div>
                      </div>
                      <div style={{ background: "#f8fafc", border: "1px solid #f1f5f9", padding: "5px 3px", borderRadius: 6 }}>
                        <div style={{ color: "#0f172a", fontWeight: 750 }}>AI / ML</div>
                        <div style={{ color: "#2563eb", fontWeight: 800 }}>76.5% &bull; Border</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "target" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 750, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Graduation CGPA Target
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: "#2563eb",
                          background: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          padding: "1px 7px",
                          borderRadius: 5,
                          fontFamily: "'Space Mono', monospace",
                        }}
                      >
                        {goalCgpa.toFixed(2)} Target
                      </span>
                    </div>

                    <input
                      type="range"
                      min="8.40"
                      max="9.00"
                      step="0.05"
                      value={goalCgpa}
                      onChange={(e) => setGoalCgpa(parseFloat(e.target.value))}
                      style={{
                        width: "100%",
                        height: 4,
                        background: `linear-gradient(to right, #2563eb 0%, #2563eb ${Math.max(0, Math.min(100, ((goalCgpa - 8.40) / (9.00 - 8.40)) * 100))}%, #dadce0 ${Math.max(0, Math.min(100, ((goalCgpa - 8.40) / (9.00 - 8.40)) * 100))}%, #dadce0 100%)`,
                        marginBottom: 12,
                      }}
                    />

                    {/* Output Display Card */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)",
                        border: "1px solid #dbeafe",
                        padding: "10px 12px",
                        borderRadius: 10,
                        marginBottom: 10,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 9.5, fontWeight: 750, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          Required Sem 7 & 8 SGPA
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", fontFamily: "'Space Mono', monospace", marginTop: 2 }}>
                          {reqSgpa}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            fontSize: 10,
                            fontWeight: 750,
                            color: parseFloat(reqSgpa) <= 9.2 ? "#15803d" : "#b45309",
                            background: parseFloat(reqSgpa) <= 9.2 ? "#dcfce7" : "#fef3c7",
                            border: `1px solid ${parseFloat(reqSgpa) <= 9.2 ? "#86efac" : "#fde68a"}`,
                            padding: "2px 7px",
                            borderRadius: 5,
                          }}
                        >
                          <Zap size={10} strokeWidth={2.8} />
                          <span>{parseFloat(reqSgpa) <= 9.2 ? "Achievable" : "Ambitious"}</span>
                        </span>
                        <div style={{ fontSize: 9.5, color: "#64748b", marginTop: 2 }}>
                          36 Credits Remaining
                        </div>
                      </div>
                    </div>

                    {/* Centurion 160 Credits Breakdown Bar */}
                    <div
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #f1f5f9",
                        padding: "7px 10px",
                        borderRadius: 7,
                        fontSize: 10,
                        color: "#64748b",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>124 / 160 Credits Completed</span>
                      <span style={{ color: "#2563eb", fontWeight: 750 }}>77.5% Degree Progress</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Trust Line (SVGs Only, No Emojis) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderTop: "1px solid #f1f5f9",
                  paddingTop: 10,
                  fontSize: 10.5,
                  color: "#64748b",
                  fontWeight: 650,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <ShieldCheck size={12} color="#2563eb" strokeWidth={2.4} />
                  <span>CUTM Matrix</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Sparkles size={12} color="#059669" strokeWidth={2.4} />
                  <span>Live Simulator</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <CheckCircle2 size={12} color="#2563eb" strokeWidth={2.4} />
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
