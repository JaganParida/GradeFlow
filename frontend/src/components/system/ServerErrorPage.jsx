import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ServerCrash,
  RefreshCw,
  Home as HomeIcon,
  AlertTriangle,
} from "lucide-react";

export default function ServerErrorPage({ onRetry }) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      if (onRetry) await onRetry();
      else window.location.reload();
    } finally {
      setTimeout(() => setRetrying(false), 800);
    }
  };

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

      {/* ── Animated Server Glitch & Spark SVG ── */}
      <div style={{ width: "100%", maxWidth: 280, height: 170, marginBottom: 20, position: "relative" }}>
        <svg viewBox="0 0 280 170" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="glitchServerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <filter id="glitchGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#dc2626" floodOpacity="0.18" />
            </filter>
          </defs>

          {/* Server Unit */}
          <rect x="70" y="30" width="140" height="110" rx="14" fill="url(#glitchServerGrad)" filter="url(#glitchGlow)" />
          
          {/* Top Panel */}
          <rect x="85" y="44" width="110" height="22" rx="6" fill="#334155" />
          <circle cx="98" cy="55" r="3" fill="#ef4444">
            <animate attributeName="opacity" values="1;0.2;1" dur="0.8s" repeatCount="indefinite" />
          </circle>
          <line x1="110" y1="55" x2="180" y2="55" stroke="#64748b" strokeWidth="2" strokeDasharray="3 3" />

          {/* Middle Glitch Panel with Zigzag Spark */}
          <rect x="85" y="74" width="110" height="22" rx="6" fill="#334155" />
          <circle cx="98" cy="85" r="3" fill="#f59e0b" />
          <path d="M120 85 L135 78 L145 92 L160 85" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />

          {/* Bottom Panel */}
          <rect x="85" y="104" width="110" height="22" rx="6" fill="#334155" />
          <circle cx="98" cy="115" r="3" fill="#10b981" />
          <line x1="110" y1="115" x2="180" y2="115" stroke="#64748b" strokeWidth="2" strokeDasharray="3 3" />
        </svg>

        {/* Floating Warning Prism */}
        <motion.div
          animate={{ y: [-6, 6, -6], rotate: [-5, 5, -5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: 10,
            right: 36,
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#dc2626",
          }}
        >
          <AlertTriangle size={20} />
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
        Something Went Wrong
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
          maxWidth: 480,
          margin: "0 0 32px 0",
        }}
      >
        Our backend encountered an unexpected error while processing this academic request.
        Our engineers have been notified automatically.
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
          onClick={handleRetry}
          disabled={retrying}
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
            cursor: retrying ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <RefreshCw size={16} className={retrying ? "gf-spin" : ""} />
          <span>{retrying ? "Reloading..." : "Try Again"}</span>
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
          <span>Return Home</span>
        </Link>
      </motion.div>
    </div>
  );
}
