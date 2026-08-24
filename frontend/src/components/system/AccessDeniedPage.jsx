import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  Home as HomeIcon,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function AccessDeniedPage() {
  const { hasActiveSession, currentRegNo } = useApp();

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
        background: "radial-gradient(100% 60% at 50% 10%, rgba(220, 38, 38, 0.04) 0%, #fcfdfe 100%)",
        position: "relative",
      }}
      role="alert"
      aria-live="polite"
    >
      {/* ── Animated Biometric Shield SVG ── */}
      <div style={{ width: "100%", maxWidth: 280, height: 170, marginBottom: 20, position: "relative" }}>
        <svg viewBox="0 0 280 170" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
            <filter id="shieldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#dc2626" floodOpacity="0.22" />
            </filter>
          </defs>

          {/* Holographic Concentric Rings */}
          <circle cx="140" cy="85" r="68" stroke="#fecaca" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
          <circle cx="140" cy="85" r="82" stroke="#fee2e2" strokeWidth="1" opacity="0.4" />

          {/* Security Shield */}
          <path
            d="M140 20 L190 44 V92 C190 126 140 150 140 150 C140 150 90 126 90 92 V44 Z"
            fill="url(#shieldGrad)"
            filter="url(#shieldGlow)"
          />

          {/* Inner Lock Accent */}
          <rect x="125" y="80" width="30" height="24" rx="5" fill="#ffffff" />
          <path d="M130 80 V70 C130 64.5 134.5 60 140 60 C145.5 60 150 64.5 150 70 V80" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        </svg>

        {/* Floating Warning Icon */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            bottom: 8,
            right: 48,
            width: 38,
            height: 38,
            borderRadius: 12,
            background: "#ffffff",
            border: "1px solid #fecaca",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#dc2626",
            boxShadow: "0 6px 16px rgba(220, 38, 38, 0.15)",
          }}
        >
          <ShieldAlert size={18} />
        </motion.div>
      </div>

      {/* ── Headline ── */}
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          fontSize: "clamp(26px, 4.5vw, 36px)",
          fontWeight: 800,
          color: "#0f172a",
          margin: "0 0 10px 0",
          letterSpacing: "-0.035em",
          lineHeight: 1.2,
        }}
      >
        Access Restricted
      </motion.h1>

      {/* ── Subtitle ── */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          fontSize: 15.5,
          color: "#64748b",
          lineHeight: 1.6,
          maxWidth: 460,
          margin: "0 0 32px 0",
        }}
      >
        You do not have administrative permission to view this resource, management tool, or protected student record.
      </motion.p>

      {/* ── Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}
      >
        <Link
          to={hasActiveSession ? `/dashboard/${currentRegNo}` : "/"}
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
