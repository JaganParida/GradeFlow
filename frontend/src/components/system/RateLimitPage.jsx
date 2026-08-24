import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { RefreshCw, Home as HomeIcon } from "lucide-react";

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

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        background: "radial-gradient(ellipse at 50% 15%, rgba(234, 88, 12, 0.05) 0%, #fcfdfe 70%)",
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

      {/* ── Animated Hourglass & Chronometer Vector Graphic ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
        style={{ width: "100%", maxWidth: 300, height: 160, marginBottom: 20 }}
      >
        <svg viewBox="0 0 300 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="sandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>

          {/* Background Ambient Kinetic Rings */}
          <circle cx="150" cy="80" r="64" stroke="#fed7aa" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.6" />
          <circle cx="150" cy="80" r="48" stroke="#ffedd5" strokeWidth="1.2" />

          {/* Hourglass Plates */}
          <rect x="105" y="18" width="90" height="10" rx="4" fill="#334155" />
          <rect x="105" y="132" width="90" height="10" rx="4" fill="#334155" />

          {/* Glass Contour */}
          <path
            d="M114 28 L146 76 C148 79 148 81 146 84 L114 132 H186 L154 84 C152 81 152 79 154 76 L186 28 Z"
            fill="#ffffff"
            stroke="#cbd5e1"
            strokeWidth="2"
          />

          {/* Top Sand Fill */}
          <path d="M125 36 H175 L150 72 Z" fill="url(#sandGrad)" />

          {/* Flowing Center Sand Line */}
          <line x1="150" y1="74" x2="150" y2="114" stroke="#d97706" strokeWidth="2.5" strokeDasharray="3 3">
            <animate attributeName="stroke-dashoffset" values="12;0" dur="0.8s" repeatCount="indefinite" />
          </line>

          {/* Bottom Sand Mound */}
          <path d="M124 130 Q150 112 176 130 Z" fill="url(#sandGrad)" />
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
        Too Many Requests
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
          margin: "0 0 16px 0",
        }}
      >
        {message ||
          "You've sent multiple queries in a short time frame. To ensure high availability for all students, please wait a few seconds before retrying."}
      </motion.p>

      {/* ── Clean Inline Cooldown Status ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          fontSize: 13.5,
          fontWeight: 650,
          color: countdown > 0 ? "#ea580c" : "#16a34a",
          marginBottom: 28,
        }}
      >
        {countdown > 0 ? `Cooldown active • Ready in ${countdown}s` : "Cooldown complete • You may proceed"}
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
          <span>Return to Home</span>
        </Link>
      </motion.div>
    </div>
  );
}
