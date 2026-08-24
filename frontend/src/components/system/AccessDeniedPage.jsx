import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  Home as HomeIcon,
  Lock,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function AccessDeniedPage() {
  const { hasActiveSession, currentRegNo } = useApp();

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
        background: "radial-gradient(ellipse at 50% 30%, rgba(220, 38, 38, 0.05) 0%, #fcfdfe 70%)",
        position: "relative",
      }}
      role="alert"
      aria-live="polite"
    >
      {/* ── Animated Biometric Shield SVG ── */}
      <div style={{ width: "100%", maxWidth: 280, height: 180, marginBottom: 24, position: "relative" }}>
        <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
            <filter id="shieldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#dc2626" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Holographic Concentric Rings */}
          <circle cx="140" cy="90" r="70" stroke="#fecaca" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
          <circle cx="140" cy="90" r="85" stroke="#fee2e2" strokeWidth="1" opacity="0.4" />

          {/* Security Shield */}
          <path
            d="M140 25 L190 48 V98 C190 132 140 155 140 155 C140 155 90 132 90 98 V48 Z"
            fill="url(#shieldGrad)"
            filter="url(#shieldGlow)"
          />

          {/* Inner Lock Accent */}
          <rect x="125" y="85" width="30" height="24" rx="5" fill="#ffffff" />
          <path d="M130 85 V75 C130 69.5 134.5 65 140 65 C145.5 65 150 69.5 150 75 V85" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
        </svg>

        {/* Floating Warning Icon */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            bottom: 12,
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

      {/* ── Status Badge ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "#fef2f2",
          border: "1px solid #fecaca",
          padding: "4px 14px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 750,
          color: "#b91c1c",
          marginBottom: 16,
          letterSpacing: "0.02em",
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#dc2626" }} />
        HTTP 403 &bull; ACCESS RESTRICTED
      </motion.div>

      {/* ── Headline ── */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          fontSize: "clamp(24px, 4vw, 32px)",
          fontWeight: 800,
          color: "#0f172a",
          margin: "0 0 12px 0",
          letterSpacing: "-0.03em",
          lineHeight: 1.25,
        }}
      >
        Restricted Area or Record
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
          maxWidth: 460,
          margin: "0 0 32px 0",
        }}
      >
        You do not have permission to view this resource, administrative tool, or student record.
      </motion.p>

      {/* ── Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}
      >
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
          <span>{hasActiveSession ? "Go to My Dashboard" : "Return to Home"}</span>
        </Link>
      </motion.div>
    </div>
  );
}
