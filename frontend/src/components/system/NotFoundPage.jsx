import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home as HomeIcon,
  ArrowLeft,
  Calendar,
  CheckSquare,
  BarChart2,
  Trophy,
  Compass,
  Search,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function NotFoundPage() {
  const { hasActiveSession, currentRegNo } = useApp();
  const navigate = useNavigate();

  const QUICK_LINKS = [
    { label: "Dashboard", href: hasActiveSession ? `/dashboard/${currentRegNo}` : "/", icon: HomeIcon },
    { label: "Timetable", href: "/timetable", icon: Calendar },
    { label: "Attendance", href: "/attendance", icon: CheckSquare },
    { label: "Analytics", href: "/analytics", icon: BarChart2 },
    { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  ];

  return (
    <div
      style={{
        minHeight: "90vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "60px 20px",
        boxSizing: "border-box",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: "radial-gradient(ellipse at 50% 30%, rgba(37, 99, 235, 0.05) 0%, #fcfdfe 70%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Bespoke Animated SVG Vector Illustration ── */}
      <div style={{ width: "100%", maxWidth: 320, height: 200, marginBottom: 24, position: "relative" }}>
        <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          {/* Subtle Grid Stars */}
          <circle cx="40" cy="30" r="2" fill="#cbd5e1" opacity="0.6" />
          <circle cx="280" cy="45" r="2.5" fill="#cbd5e1" opacity="0.6" />
          <circle cx="80" cy="160" r="1.5" fill="#cbd5e1" opacity="0.4" />
          <circle cx="260" cy="150" r="2" fill="#cbd5e1" opacity="0.5" />

          {/* Floating Planet Orbit */}
          <ellipse cx="160" cy="100" rx="90" ry="24" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4 4" />

          {/* Glowing Center Planet (The Lost Route) */}
          <defs>
            <linearGradient id="planetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <filter id="glow404" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#2563eb" floodOpacity="0.25" />
            </filter>
          </defs>

          <circle cx="160" cy="100" r="44" fill="url(#planetGrad)" filter="url(#glow404)" />
          {/* Planet Rings & Surface Cracks */}
          <path d="M125 100 Q160 120 195 100" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
          <path d="M132 85 Q160 102 188 85" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" opacity="0.5" />

          {/* Large Stylized '4' Left */}
          <text x="55" y="125" fill="#0f172a" fontSize="76" fontWeight="900" fontFamily="sans-serif" letterSpacing="-4" opacity="0.88">
            4
          </text>

          {/* Large Stylized '4' Right */}
          <text x="215" y="125" fill="#0f172a" fontSize="76" fontWeight="900" fontFamily="sans-serif" letterSpacing="-4" opacity="0.88">
            4
          </text>
        </svg>

        {/* Floating Satellite Animation */}
        <motion.div
          animate={{
            y: [-6, 6, -6],
            rotate: [-4, 4, -4],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            top: 20,
            right: 40,
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#2563eb",
          }}
        >
          <Compass size={20} />
        </motion.div>
      </div>

      {/* ── Status Chip ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "#eff6ff",
          border: "1px solid #dbeafe",
          padding: "4px 14px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 750,
          color: "#2563eb",
          marginBottom: 16,
          letterSpacing: "0.02em",
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563eb" }} />
        ERROR 404 &bull; PAGE NOT FOUND
      </motion.div>

      {/* ── Headline ── */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          fontSize: "clamp(24px, 4vw, 34px)",
          fontWeight: 800,
          color: "#0f172a",
          margin: "0 0 12px 0",
          letterSpacing: "-0.03em",
          lineHeight: 1.2,
        }}
      >
        Lost in Academic Cyberspace?
      </motion.h1>

      {/* ── Subtitle ── */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          fontSize: 15.5,
          color: "#64748b",
          lineHeight: 1.6,
          maxWidth: 480,
          margin: "0 0 32px 0",
        }}
      >
        The page you are searching for might have been moved, renamed, or temporarily unavailable.
        Jump straight back into your academic hub below:
      </motion.p>

      {/* ── Quick Interactive Shortcuts Grid ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          flexWrap: "wrap",
          maxWidth: 560,
          marginBottom: 36,
        }}
      >
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.label}
              to={link.href}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 16px",
                borderRadius: 999,
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                color: "#334155",
                fontSize: 13.5,
                fontWeight: 650,
                textDecoration: "none",
                transition: "all 0.18s ease",
                boxShadow: "0 2px 6px rgba(15, 23, 42, 0.03)",
              }}
              className="gf-state-btn-secondary"
            >
              <Icon size={15} color="#64748b" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </motion.div>

      {/* ── Main Action Buttons ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="gf-state-btn-secondary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 22px",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 650,
            background: "#ffffff",
            color: "#334155",
            border: "1px solid #cbd5e1",
            cursor: "pointer",
            outline: "none",
          }}
        >
          <ArrowLeft size={16} />
          <span>Go Back</span>
        </button>

        <Link
          to={hasActiveSession ? `/dashboard/${currentRegNo}` : "/"}
          className="gf-state-btn-primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 26px",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            background: "#2563eb",
            color: "#ffffff",
            textDecoration: "none",
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.28)",
          }}
        >
          <HomeIcon size={16} />
          <span>{hasActiveSession ? "Go to Dashboard" : "Return to Home"}</span>
        </Link>
      </motion.div>
    </div>
  );
}
