import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Server,
  RefreshCw,
  Home as HomeIcon,
  Clock,
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
        background: "radial-gradient(ellipse at 50% 30%, rgba(245, 158, 11, 0.05) 0%, #fcfdfe 70%)",
        position: "relative",
      }}
      role="alert"
      aria-live="polite"
    >
      {/* ── Animated Bridge / Satellite Sync SVG ── */}
      <div style={{ width: "100%", maxWidth: 280, height: 180, marginBottom: 24, position: "relative" }}>
        <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="cloudBridgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>

          {/* Data Center Icon Left */}
          <rect x="40" y="70" width="60" height="60" rx="10" fill="#334155" />
          <rect x="48" y="78" width="44" height="10" rx="3" fill="#10b981" />
          <rect x="48" y="94" width="44" height="10" rx="3" fill="#3b82f6" />
          <rect x="48" y="110" width="44" height="10" rx="3" fill="#f59e0b" />

          {/* University Cloud Right */}
          <rect x="180" y="70" width="60" height="60" rx="10" fill="#1e293b" />
          <circle cx="210" cy="100" r="14" fill="#3b82f6" opacity="0.3" />
          <path d="M196 100 Q210 88 224 100" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />

          {/* Pulsing Sync Bridge Connecting Both */}
          <line x1="105" y1="100" x2="175" y2="100" stroke="#f59e0b" strokeWidth="3" strokeDasharray="5 5">
            <animate attributeName="stroke-dashoffset" values="0;20" dur="1s" repeatCount="indefinite" />
          </line>
        </svg>

        {/* Floating Radio Dish Icon */}
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
          }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: 14,
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
            boxShadow: "0 6px 16px rgba(245, 158, 11, 0.18)",
          }}
        >
          <Radio size={20} />
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
          background: "#fffbeb",
          border: "1px solid #fde68a",
          padding: "4px 14px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 750,
          color: "#92400e",
          marginBottom: 16,
          letterSpacing: "0.02em",
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b" }} />
        HTTP 503 &bull; SERVICE TEMPORARILY UNAVAILABLE
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
        Connecting to University Services
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
        GradeFlow is reconnecting to academic databases. Service will be restored in a moment.
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
          onClick={handleRefresh}
          disabled={refreshing}
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
            cursor: refreshing ? "not-allowed" : "pointer",
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.28)",
          }}
        >
          <RefreshCw size={16} className={refreshing ? "gf-spin" : ""} />
          <span>{refreshing ? "Reconnecting..." : "Refresh Status"}</span>
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
