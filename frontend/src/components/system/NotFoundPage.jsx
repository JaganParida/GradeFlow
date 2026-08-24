import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Compass,
  ArrowLeft,
  Home as HomeIcon,
  Sparkles,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { studentSession } = useApp();
  const hasActiveSession = Boolean(studentSession?.regNo);
  const currentRegNo = studentSession?.regNo || "";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        background: "radial-gradient(ellipse at 50% 15%, rgba(37, 99, 235, 0.05) 0%, #fcfdfe 80%)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px 20px",
        boxSizing: "border-box",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflowY: "auto",
      }}
      role="alert"
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

      {/* ── 60fps Hardware-Accelerated Cosmic Compass Vector Art ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
        style={{ width: "100%", maxWidth: 320, height: 160, marginBottom: 20, position: "relative" }}
      >
        <svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="nfGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.05" />
            </linearGradient>
            <radialGradient id="planetGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Ambient Cosmic Rings */}
          <ellipse cx="160" cy="80" rx="120" ry="40" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.8" />
          <ellipse cx="160" cy="80" rx="80" ry="26" stroke="#bfdbfe" strokeWidth="1.2" opacity="0.6" />

          {/* Floating Central Lost Compass Planet */}
          <circle cx="160" cy="80" r="44" fill="url(#nfGlow)" stroke="#3b82f6" strokeWidth="2" />
          <circle cx="160" cy="80" r="32" fill="#eff6ff" />

          {/* Compass Needle */}
          <polygon points="160,56 166,80 160,76 154,80" fill="#2563eb" />
          <polygon points="160,104 166,80 160,84 154,80" fill="#94a3b8" />
          <circle cx="160" cy="80" r="3.5" fill="#0f172a" />

          {/* Satellite Orbit Line */}
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
          margin: "0 0 32px 0",
        }}
      >
        The page you are looking for might have been moved, deleted, or doesn't exist in GradeFlow.
      </motion.p>

      {/* ── Primary Action Controls ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
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
