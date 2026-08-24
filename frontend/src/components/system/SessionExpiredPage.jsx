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
        background: "radial-gradient(100% 60% at 50% 10%, rgba(37, 99, 235, 0.05) 0%, #fcfdfe 100%)",
        position: "relative",
      }}
      role="alert"
      aria-live="polite"
    >
      {/* ── Brand Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}
      >
        <img
          src="/webisteLogo.png"
          alt="GradeFlow Logo"
          style={{
            height: 38,
            width: "auto",
            objectFit: "contain",
            display: "block",
          }}
        />
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.5px",
          }}
        >
          GradeFlow
        </span>
      </motion.div>

      {/* ── Animated Security Padlock SVG ── */}
      <div style={{ width: "100%", maxWidth: 280, height: 170, marginBottom: 20, position: "relative" }}>
        <svg viewBox="0 0 280 170" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
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
            d="M105 80 V48 C105 28 121 12 140 12 C159 12 175 28 175 48 V80"
            stroke="#94a3b8"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Lock Body */}
          <rect x="90" y="70" width="100" height="85" rx="18" fill="url(#padlockGrad)" filter="url(#lockGlow)" />
          
          {/* Keyhole */}
          <circle cx="140" cy="105" r="8" fill="#ffffff" />
          <path d="M137 109 L135 127 H145 L143 109 Z" fill="#ffffff" />
        </svg>

        {/* Floating Key Icon */}
        <motion.div
          animate={{ y: [-5, 5, -5], rotate: [-8, 8, -8] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            bottom: 8,
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
          }}
        >
          <Key size={18} />
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
        Session Expired
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
        For student privacy and session security, authenticated logins automatically expire after inactivity. Sign in to continue where you left off.
      </motion.p>

      {/* ── Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}
      >
        <button
          type="button"
          onClick={onSignIn || (() => openStudentAuthModal({ type: "dashboard" }))}
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
            transition: "all 0.15s ease",
          }}
        >
          <LogIn size={16} />
          <span>Sign In Again</span>
        </button>

        <Link
          to="/"
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
            transition: "all 0.15s ease",
          }}
        >
          <HomeIcon size={16} />
          <span>Return to Home</span>
        </Link>
      </motion.div>
    </div>
  );
}
