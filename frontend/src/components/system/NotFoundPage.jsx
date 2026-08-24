import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Home as HomeIcon } from "lucide-react";
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
        background: "radial-gradient(ellipse at 50% 15%, rgba(37, 99, 235, 0.05) 0%, #fcfdfe 70%)",
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

      {/* ── 60fps Cosmic Exploration 404 Vector Graphic ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
        style={{ width: "100%", maxWidth: 340, height: 170, marginBottom: 20 }}
      >
        <svg viewBox="0 0 340 170" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="nfPortalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {/* Planetary Orbit Rings */}
          <ellipse cx="170" cy="85" rx="130" ry="44" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="5 7" />
          <ellipse cx="170" cy="85" rx="90" ry="30" stroke="#bfdbfe" strokeWidth="1.5" strokeDasharray="3 4">
            <animate attributeName="stroke-dashoffset" values="0;28" dur="4s" repeatCount="indefinite" />
          </ellipse>

          {/* Left Hero '4' */}
          <text x="54" y="118" fill="#0f172a" fontSize="88" fontWeight="900" letterSpacing="-5" opacity="0.94">
            4
          </text>

          {/* Center Cosmic Globe / Lost Compass */}
          <circle cx="170" cy="85" r="48" fill="url(#nfPortalGrad)" stroke="#3b82f6" strokeWidth="2" />
          <circle cx="170" cy="85" r="36" fill="#ffffff" stroke="#dbeafe" strokeWidth="1.5" />
          
          {/* Internal Radar Grid */}
          <circle cx="170" cy="85" r="22" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="170" y1="49" x2="170" y2="121" stroke="#f1f5f9" strokeWidth="1" />
          <line x1="134" y1="85" x2="206" y2="85" stroke="#f1f5f9" strokeWidth="1" />

          {/* Rotating Compass Needles */}
          <polygon points="170,60 176,85 170,81 164,85" fill="#2563eb" />
          <polygon points="170,110 176,85 170,89 164,85" fill="#94a3b8" />
          <circle cx="170" cy="85" r="4" fill="#0f172a" />

          {/* Satellite Orbit Dots */}
          <circle cx="106" cy="72" r="3.5" fill="#3b82f6">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="236" cy="98" r="4" fill="#f59e0b">
            <animate attributeName="opacity" values="1;0.3;1" dur="2.5s" repeatCount="indefinite" />
          </circle>

          {/* Right Hero '4' */}
          <text x="234" y="118" fill="#0f172a" fontSize="88" fontWeight="900" letterSpacing="-5" opacity="0.94">
            4
          </text>
        </svg>
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

      {/* ── Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
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
