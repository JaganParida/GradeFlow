import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Hourglass,
  RefreshCw,
  Home as HomeIcon,
  Zap,
} from "lucide-react";

export default function RateLimitPage({ message, onRetry }) {
  const [countdown, setCountdown] = useState(15);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      if (onRetry) await onRetry();
      else window.location.reload();
    } finally {
      setTimeout(() => setRetrying(false), 700);
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
        background: "radial-gradient(ellipse at 50% 30%, rgba(234, 88, 12, 0.05) 0%, #fcfdfe 70%)",
        position: "relative",
      }}
      role="alert"
      aria-live="polite"
    >
      {/* ── Animated Hourglass Vector SVG ── */}
      <div style={{ width: "100%", maxWidth: 280, height: 180, marginBottom: 24, position: "relative" }}>
        <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="sandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <filter id="hourglassGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#ea580c" floodOpacity="0.2" />
            </filter>
          </defs>

          {/* Hourglass Frame */}
          <rect x="90" y="20" width="100" height="12" rx="4" fill="#334155" />
          <rect x="90" y="148" width="100" height="12" rx="4" fill="#334155" />

          {/* Hourglass Glass Contour */}
          <path
            d="M100 32 L136 86 C138 89 138 91 136 94 L100 148 H180 L144 94 C142 91 142 89 144 86 L180 32 Z"
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth="2"
            filter="url(#hourglassGlow)"
          />

          {/* Top Sand Pile */}
          <path d="M112 40 H168 L140 82 Z" fill="url(#sandGrad)" />

          {/* Dripping Sand Stream */}
          <line x1="140" y1="84" x2="140" y2="124" stroke="#d97706" strokeWidth="2.5" strokeDasharray="3 3" />

          {/* Bottom Sand Mound */}
          <path d="M110 146 Q140 126 170 146 Z" fill="url(#sandGrad)" />
        </svg>

        {/* Floating Rotating Icon */}
        <motion.div
          animate={{ rotate: 180 }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
          style={{
            position: "absolute",
            top: 20,
            right: 42,
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ea580c",
            boxShadow: "0 6px 16px rgba(234, 88, 12, 0.15)",
          }}
        >
          <Hourglass size={18} />
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
          background: "#fff7ed",
          border: "1px solid #fed7aa",
          padding: "4px 14px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 750,
          color: "#9a3412",
          marginBottom: 16,
          letterSpacing: "0.02em",
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ea580c" }} />
        RATE LIMITED &bull; HTTP 429
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
        High Activity &bull; Slowing Down
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
          margin: "0 0 28px 0",
        }}
      >
        {message ||
          "You've made multiple quick requests in a short window. To ensure fair performance for all students, please wait a moment."}
      </motion.p>

      {/* ── Cooldown Pill ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          padding: "8px 18px",
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 700,
          color: "#334155",
          marginBottom: 32,
        }}
      >
        <span>Automatic Cooldown:</span>
        <span style={{ color: "#ea580c", fontFamily: "monospace", fontSize: 14 }}>
          {countdown > 0 ? `${countdown}s remaining` : "Ready to retry!"}
        </span>
      </motion.div>

      {/* ── Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
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
          <span>{retrying ? "Retrying..." : "Try Again Now"}</span>
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
