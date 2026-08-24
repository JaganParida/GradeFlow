import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Server,
  RefreshCw,
  Home as HomeIcon,
  Radio,
} from "lucide-react";

export default function ServiceUnavailablePage({ onRetry }) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (onRetry) await onRetry();
      else window.location.reload();
    } finally {
      setTimeout(() => setRefreshing(false), 800);
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
        background: "radial-gradient(100% 60% at 50% 10%, rgba(245, 158, 11, 0.04) 0%, #fcfdfe 100%)",
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

      {/* ── Animated Bridge / Satellite Sync SVG ── */}
      <div style={{ width: "100%", maxWidth: 280, height: 170, marginBottom: 20, position: "relative" }}>
        <svg viewBox="0 0 280 170" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          {/* Data Center Icon Left */}
          <rect x="40" y="60" width="60" height="60" rx="10" fill="#334155" />
          <rect x="48" y="68" width="44" height="10" rx="3" fill="#10b981" />
          <rect x="48" y="84" width="44" height="10" rx="3" fill="#3b82f6" />
          <rect x="48" y="100" width="44" height="10" rx="3" fill="#f59e0b" />

          {/* University Cloud Right */}
          <rect x="180" y="60" width="60" height="60" rx="10" fill="#1e293b" />
          <circle cx="210" cy="90" r="14" fill="#3b82f6" opacity="0.3" />
          <path d="M196 90 Q210 78 224 90" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />

          {/* Pulsing Sync Bridge Connecting Both */}
          <line x1="105" y1="90" x2="175" y2="90" stroke="#f59e0b" strokeWidth="3" strokeDasharray="5 5">
            <animate attributeName="stroke-dashoffset" values="0;20" dur="1s" repeatCount="indefinite" />
          </line>
        </svg>

        {/* Floating Radio Dish Icon */}
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "#fffbeb",
            border: "1px solid #fde68a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#d97706",
          }}
        >
          <Radio size={20} />
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
        Connecting to Academic Services
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
        GradeFlow is reconnecting to university databases. Live access will be restored in a moment.
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
          onClick={handleRefresh}
          disabled={refreshing}
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
            cursor: refreshing ? "not-allowed" : "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <RefreshCw size={16} className={refreshing ? "gf-spin" : ""} />
          <span>{refreshing ? "Reconnecting..." : "Refresh Status"}</span>
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
