import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Lock,
  LogIn,
  Home as HomeIcon,
  ShieldCheck,
  Key,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function SessionExpiredPage({ onSignIn }) {
  const { openStudentAuthModal } = useApp();

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
      }}
      role="alert"
      aria-live="polite"
    >
      {/* ── Animated Security Padlock SVG ── */}
      <div style={{ width: "100%", maxWidth: 280, height: 180, marginBottom: 24, position: "relative" }}>
        <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="padlockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <filter id="lockGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#2563eb" floodOpacity="0.22" />
            </filter>
          </defs>

          {/* Shackle */}
          <path
            d="M105 85 V52 C105 32 121 16 140 16 C159 16 175 32 175 52 V85"
            stroke="#94a3b8"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Lock Body */}
          <rect x="90" y="75" width="100" height="85" rx="18" fill="url(#padlockGrad)" filter="url(#lockGlow)" />
          
          {/* Keyhole */}
          <circle cx="140" cy="110" r="8" fill="#ffffff" />
          <path d="M137 114 L135 132 H145 L143 114 Z" fill="#ffffff" />
        </svg>

        {/* Floating Key Icon */}
        <motion.div
          animate={{
            y: [-5, 5, -5],
            rotate: [-8, 8, -8],
          }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            bottom: 12,
            right: 48,
            width: 38,
            height: 38,
            borderRadius: 12,
            background: "#ffffff",
            border: "1px solid #dbeafe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#2563eb",
            boxShadow: "0 6px 16px rgba(37, 99, 235, 0.15)",
          }}
        >
          <Key size={18} />
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
        SECURITY NOTICE &bull; SESSION ENDED
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
        Your Session Has Timed Out
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
        For student privacy, session security, and data protection, authenticated logins automatically expire after inactivity. Sign in again to view your latest grades.
      </motion.p>

      {/* ── Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}
      >
        <button
          type="button"
          onClick={onSignIn || (() => openStudentAuthModal({ type: "dashboard" }))}
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
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.28)",
          }}
        >
          <LogIn size={16} />
          <span>Sign In Again</span>
        </button>

        <Link
          to="/"
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
            textDecoration: "none",
          }}
        >
          <HomeIcon size={16} />
          <span>Return to Home</span>
        </Link>
      </motion.div>
    </div>
  );
}
