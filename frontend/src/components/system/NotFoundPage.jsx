import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home as HomeIcon,
  ArrowLeft,
  Calendar,
  CheckSquare,
  BarChart2,
  Trophy,
  Search,
  ArrowUpRight,
  Sparkles,
  FileText,
  Calculator,
  Layers,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function NotFoundPage() {
  const { hasActiveSession, currentRegNo } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const DISCOVERY_HUB = [
    { label: "Student Dashboard", href: hasActiveSession ? `/dashboard/${currentRegNo}` : "/", icon: HomeIcon, desc: "Academic overview, CGPA & marks" },
    { label: "Class Timetable", href: "/timetable", icon: Calendar, desc: "Interactive weekly lecture schedule" },
    { label: "Attendance Simulator", href: "/attendance", icon: CheckSquare, desc: "Live attendance margin calculation" },
    { label: "Performance Analytics", href: "/analytics", icon: BarChart2, desc: "Subject deep-dive & GPA trends" },
    { label: "University Leaderboard", href: "/leaderboard", icon: Trophy, desc: "Cohort, batch & department rankings" },
    { label: "Grade Sheet Engine", href: hasActiveSession ? `/analytics/${currentRegNo}?tab=grades` : "/", icon: FileText, desc: "Official verified semester marksheet" },
  ];

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return DISCOVERY_HUB.slice(0, 4);
    const q = searchQuery.toLowerCase();
    return DISCOVERY_HUB.filter(
      (item) => item.label.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q)
    );
  }, [searchQuery, hasActiveSession, currentRegNo]);

  return (
    <div
      style={{
        minHeight: "92vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "60px 20px",
        boxSizing: "border-box",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: "radial-gradient(ellipse at 50% 15%, rgba(37, 99, 235, 0.06) 0%, #fcfdfe 75%)",
        position: "relative",
        overflow: "hidden",
      }}
      role="alert"
    >
      {/* ── Background Ambient Glow ── */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 540,
          height: 320,
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.09) 0%, transparent 70%)",
          pointerEvents: "none",
          filter: "blur(40px)",
        }}
      />

      {/* ── 60fps Smooth Cosmic Orbit 404 Illustration ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{ width: "100%", maxWidth: 320, height: 170, marginBottom: 12, position: "relative" }}
      >
        <svg viewBox="0 0 320 170" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="orbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <filter id="orbShadowFilter" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#2563eb" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Orbit rings */}
          <ellipse cx="160" cy="85" rx="105" ry="28" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="5 5" />

          {/* Core Cosmic Orb */}
          <circle cx="160" cy="85" r="42" fill="url(#orbGradient)" filter="url(#orbShadowFilter)" />
          <path d="M126 85 Q160 106 194 85" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
          <path d="M134 70 Q160 88 186 70" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

          {/* Left Large Modern Number '4' */}
          <text x="50" y="112" fill="#0f172a" fontSize="80" fontWeight="900" letterSpacing="-5" opacity="0.92">
            4
          </text>

          {/* Right Large Modern Number '4' */}
          <text x="225" y="112" fill="#0f172a" fontSize="80" fontWeight="900" letterSpacing="-5" opacity="0.92">
            4
          </text>
        </svg>

        {/* Floating Sparkle Micro-badge */}
        <motion.div
          animate={{ y: [-5, 5, -5], rotate: [-4, 4, -4] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: 10,
            right: 48,
            width: 38,
            height: 38,
            borderRadius: 12,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#2563eb",
          }}
        >
          <Sparkles size={18} />
        </motion.div>
      </motion.div>

      {/* ── Headline ── */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        style={{
          fontSize: "clamp(26px, 4.5vw, 36px)",
          fontWeight: 800,
          color: "#0f172a",
          margin: "0 0 10px 0",
          letterSpacing: "-0.035em",
          lineHeight: 1.2,
        }}
      >
        Page Not Found
      </motion.h1>

      {/* ── Description ── */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        style={{
          fontSize: 15.5,
          color: "#64748b",
          lineHeight: 1.6,
          maxWidth: 460,
          margin: "0 0 26px 0",
        }}
      >
        The link you followed may be outdated, moved, or deleted. Search GradeFlow or pick a destination below.
      </motion.p>

      {/* ── Interactive Live Spotlight Search ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        style={{ width: "100%", maxWidth: 440, position: "relative", marginBottom: 22 }}
      >
        <Search
          size={17}
          color="#94a3b8"
          style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Type to search timetable, analytics, ranks, grades..."
          style={{
            width: "100%",
            padding: "12px 16px 12px 44px",
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            fontSize: 14,
            color: "#0f172a",
            outline: "none",
            boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
            boxSizing: "border-box",
            transition: "all 0.15s ease",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#3b82f6";
            e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.14)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#e2e8f0";
            e.target.style.boxShadow = "0 4px 16px rgba(15, 23, 42, 0.04)";
          }}
        />
      </motion.div>

      {/* ── Destination Quick Jump Grid ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 10,
          width: "100%",
          maxWidth: 520,
          marginBottom: 32,
        }}
      >
        <AnimatePresence>
          {searchResults.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "11px 14px",
                  borderRadius: 12,
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  textDecoration: "none",
                  transition: "all 0.18s ease",
                  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.02)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#bfdbfe";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(37, 99, 235, 0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(15, 23, 42, 0.02)";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left" }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "#eff6ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#2563eb",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{item.desc}</div>
                  </div>
                </div>
                <ArrowUpRight size={14} color="#94a3b8" />
              </Link>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* ── Primary Action Controls ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.25 }}
        style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 22px",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 650,
            background: "#ffffff",
            color: "#334155",
            border: "1px solid #cbd5e1",
            cursor: "pointer",
            outline: "none",
            transition: "all 0.15s ease",
          }}
        >
          <ArrowLeft size={16} />
          <span>Go Back</span>
        </button>

        <Link
          to={hasActiveSession ? `/dashboard/${currentRegNo}` : "/"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 26px",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            background: "#2563eb",
            color: "#ffffff",
            textDecoration: "none",
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.28)",
            transition: "all 0.15s ease",
          }}
        >
          <HomeIcon size={16} />
          <span>{hasActiveSession ? "Go to Dashboard" : "Return to Home"}</span>
        </Link>
      </motion.div>
    </div>
  );
}
