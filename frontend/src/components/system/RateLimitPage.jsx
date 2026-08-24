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
        background: "radial-gradient(100% 60% at 50% 10%, rgba(234, 88, 12, 0.04) 0%, #fcfdfe 100%)",
        position: "relative",
      }}
      role="alert"
      aria-live="polite"
    >
      {/* ── Animated Hourglass Vector SVG ── */}
      <div style={{ width: "100%", maxWidth: 280, height: 170, marginBottom: 20, position: "relative" }}>
        <svg viewBox="0 0 280 170" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="sandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <filter id="hourglassGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#ea580c" floodOpacity="0.18" />
            </filter>
          </defs>

          {/* Hourglass Top & Bottom Plates */}
          <rect x="90" y="16" width="100" height="10" rx="4" fill="#334155" />
          <rect x="90" y="144" width="100" height="10" rx="4" fill="#334155" />

          {/* Hourglass Glass Contour */}
          <path
            d="M100 26 L136 80 C138 83 138 85 136 88 L100 144 H180 L144 88 C142 85 142 83 144 80 L180 26 Z"
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth="2"
            filter="url(#hourglassGlow)"
          />

          {/* Top Sand Pile */}
          <path d="M112 34 H168 L140 76 Z" fill="url(#sandGrad)" />

          {/* Dripping Sand Stream */}
          <line x1="140" y1="78" x2="140" y2="120" stroke="#d97706" strokeWidth="2.5" strokeDasharray="3 3" />

          {/* Bottom Sand Mound */}
          <path d="M110 142 Q140 122 170 142 Z" fill="url(#sandGrad)" />
        </svg>

        {/* Floating Hourglass Icon */}
        <motion.div
          animate={{ rotate: 180 }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
          style={{
            position: "absolute",
            top: 14,
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
        Please Slow Down
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
          margin: "0 0 24px 0",
        }}
      >
        {message ||
          "You've sent multiple requests in a short window. To ensure smooth performance for everyone, please wait a few seconds before retrying."}
      </motion.p>

      {/* ── Cooldown Pill ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          padding: "8px 18px",
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 700,
          color: "#334155",
          marginBottom: 32,
          boxShadow: "0 2px 6px rgba(15, 23, 42, 0.03)",
        }}
      >
        <span>Cooldown Period:</span>
        <span style={{ color: "#ea580c", fontFamily: "monospace", fontSize: 14 }}>
          {countdown > 0 ? `${countdown}s remaining` : "Ready to proceed"}
        </span>
      </motion.div>

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
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.28)",
            transition: "all 0.15s ease",
          }}
        >
          <RefreshCw size={16} className={retrying ? "gf-spin" : ""} />
          <span>{retrying ? "Retrying..." : "Try Again Now"}</span>
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
