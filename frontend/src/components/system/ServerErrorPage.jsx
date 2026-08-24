import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ServerCrash,
  RefreshCw,
  Home as HomeIcon,
  AlertTriangle,
  LifeBuoy,
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
      {/* ── Animated Server Glitch & Spark SVG ── */}
      <div style={{ width: "100%", maxWidth: 280, height: 180, marginBottom: 24, position: "relative" }}>
        <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="glitchServerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <filter id="glitchGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#dc2626" floodOpacity="0.2" />
            </filter>
          </defs>

          {/* Server Unit */}
          <rect x="70" y="35" width="140" height="110" rx="14" fill="url(#glitchServerGrad)" filter="url(#glitchGlow)" />
          
          {/* Top Panel */}
          <rect x="85" y="50" width="110" height="22" rx="6" fill="#334155" />
          <circle cx="98" cy="61" r="3" fill="#ef4444">
            <animate attributeName="opacity" values="1;0.2;1" dur="0.8s" repeatCount="indefinite" />
          </circle>
          <line x1="110" y1="61" x2="180" y2="61" stroke="#64748b" strokeWidth="2" strokeDasharray="3 3" />

          {/* Middle Glitch Panel with Zigzag Spark */}
          <rect x="85" y="80" width="110" height="22" rx="6" fill="#334155" />
          <circle cx="98" cy="91" r="3" fill="#f59e0b" />
          <path d="M120 91 L135 84 L145 98 L160 91" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />

          {/* Bottom Panel */}
          <rect x="85" y="110" width="110" height="22" rx="6" fill="#334155" />
          <circle cx="98" cy="121" r="3" fill="#10b981" />
          <line x1="110" y1="121" x2="180" y2="121" stroke="#64748b" strokeWidth="2" strokeDasharray="3 3" />
        </svg>

        {/* Floating Warning Prism */}
        <motion.div
          animate={{
            y: [-6, 6, -6],
            rotate: [-5, 5, -5],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: 14,
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
            boxShadow: "0 6px 16px rgba(220, 38, 38, 0.18)",
          }}
        >
          <AlertTriangle size={20} />
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
        HTTP 500 &bull; INTERNAL SERVER ISSUE
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
        Something Went Wrong on Our End
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
        Our backend encountered an unexpected error while processing this academic request.
        Our engineers have been notified automatically.
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
          onClick={handleRetry}
          disabled={retrying}
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
            cursor: retrying ? "not-allowed" : "pointer",
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.28)",
          }}
        >
          <RefreshCw size={16} className={retrying ? "gf-spin" : ""} />
          <span>{retrying ? "Reloading..." : "Try Again"}</span>
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
          <span>Return Home</span>
        </Link>
      </motion.div>
    </div>
  );
}
