import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { RefreshCw, Home as HomeIcon } from "lucide-react";

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

      {/* ── Animated Server Diagnostics Vector Graphic ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
        style={{ width: "100%", maxWidth: 300, height: 160, marginBottom: 20 }}
      >
        <svg viewBox="0 0 300 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="glitchServerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>

          {/* Background Pulse Rings */}
          <circle cx="150" cy="80" r="64" stroke="#fee2e2" strokeWidth="1.5" strokeDasharray="4 6" />
          <circle cx="150" cy="80" r="48" stroke="#fecaca" strokeWidth="1.2" />

          {/* Server Unit */}
          <rect x="80" y="24" width="140" height="112" rx="14" fill="url(#glitchServerGrad)" stroke="#334155" strokeWidth="1.5" />
          
          {/* Top Panel */}
          <rect x="94" y="38" width="112" height="22" rx="5" fill="#334155" />
          <circle cx="106" cy="49" r="3" fill="#ef4444">
            <animate attributeName="opacity" values="1;0.2;1" dur="0.8s" repeatCount="indefinite" />
          </circle>
          <line x1="118" y1="49" x2="194" y2="49" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Middle Diagnostic Panel with Pulse Circuit */}
          <rect x="94" y="68" width="112" height="22" rx="5" fill="#334155" stroke="#ef4444" strokeWidth="1" />
          <circle cx="106" cy="79" r="3" fill="#f59e0b" />
          <path d="M124 79 L138 72 L148 86 L164 79 L180 79" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
            <animate attributeName="stroke-dashoffset" values="20;0" dur="1.2s" repeatCount="indefinite" />
          </path>

          {/* Bottom Panel */}
          <rect x="94" y="98" width="112" height="22" rx="5" fill="#334155" />
          <circle cx="106" cy="109" r="3" fill="#10b981" />
          <line x1="118" y1="109" x2="194" y2="109" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
        </svg>
      </motion.div>

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
        Internal Server Error (500)
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
        Our backend encountered an unexpected condition while processing this request. Our engineering team has been automatically alerted.
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
          <span>Return to Home</span>
        </Link>
      </motion.div>
    </div>
  );
}
