import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Wrench,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Server,
} from "lucide-react";

export default function MaintenancePage({ message, onRetry }) {
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleStatusCheck = async () => {
    setChecking(true);
    setFeedback("");
    try {
      if (onRetry) {
        await onRetry();
      }
      setFeedback("System is still in maintenance mode. Please try again shortly.");
    } catch {
      setFeedback("Connection check completed. Maintenance is still active.");
    } finally {
      setTimeout(() => setChecking(false), 900);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        background: "radial-gradient(ellipse at 50% 20%, rgba(37, 99, 235, 0.06) 0%, #fcfdfe 70%)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px 24px",
        boxSizing: "border-box",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflowY: "auto",
      }}
      role="alert"
      aria-live="polite"
    >
      {/* ── Brand Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
            color: "#ffffff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: 16,
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
          }}
        >
          G
        </span>
        <span style={{ fontSize: 19, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
          GradeFlow
        </span>
      </div>

      {/* ── Animated Server Rack & Gear Graphic ── */}
      <div style={{ width: "100%", maxWidth: 300, height: 180, marginBottom: 20, position: "relative" }}>
        <svg viewBox="0 0 300 180" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="serverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <filter id="gearGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#2563eb" floodOpacity="0.2" />
            </filter>
          </defs>

          {/* Isometric Server Tower Base */}
          <rect x="80" y="30" width="140" height="120" rx="16" fill="url(#serverGrad)" filter="url(#gearGlow)" />
          
          {/* Server Blade 1 */}
          <rect x="94" y="44" width="112" height="24" rx="6" fill="#334155" stroke="#475569" strokeWidth="1" />
          <circle cx="106" cy="56" r="3" fill="#10b981">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <circle cx="116" cy="56" r="3" fill="#3b82f6" />
          <line x1="130" y1="56" x2="190" y2="56" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />

          {/* Server Blade 2 */}
          <rect x="94" y="76" width="112" height="24" rx="6" fill="#334155" stroke="#475569" strokeWidth="1" />
          <circle cx="106" cy="88" r="3" fill="#f59e0b">
            <animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="116" cy="88" r="3" fill="#10b981" />
          <line x1="130" y1="88" x2="190" y2="88" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />

          {/* Server Blade 3 */}
          <rect x="94" y="108" width="112" height="24" rx="6" fill="#334155" stroke="#475569" strokeWidth="1" />
          <circle cx="106" cy="120" r="3" fill="#10b981" />
          <circle cx="116" cy="120" r="3" fill="#3b82f6">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
          <line x1="130" y1="120" x2="190" y2="120" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />
        </svg>

        {/* Floating Rotating Gear Animation */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            top: 8,
            right: 44,
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "#eff6ff",
            border: "1.5px solid #bfdbfe",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#2563eb",
            boxShadow: "0 6px 16px rgba(37, 99, 235, 0.15)",
          }}
        >
          <Wrench size={22} />
        </motion.div>
      </div>

      {/* ── Status Pill ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "#fef3c7",
          border: "1px solid #fde68a",
          padding: "5px 16px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 750,
          color: "#92400e",
          marginBottom: 16,
          letterSpacing: "0.02em",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#d97706",
            boxShadow: "0 0 6px rgba(217, 119, 6, 0.6)",
          }}
        />
        UNDERGOING SCHEDULED MAINTENANCE
      </motion.div>

      {/* ── Headline ── */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          fontSize: "clamp(24px, 4.5vw, 34px)",
          fontWeight: 800,
          color: "#0f172a",
          margin: "0 0 12px 0",
          letterSpacing: "-0.03em",
          lineHeight: 1.25,
        }}
      >
        We're Upgrading GradeFlow
      </motion.h1>

      {/* ── Description / Message ── */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          fontSize: 15.5,
          color: "#64748b",
          lineHeight: 1.6,
          maxWidth: 500,
          margin: "0 0 24px 0",
        }}
      >
        {message ||
          "GradeFlow is temporarily offline for scheduled database optimizations and system improvements. Student access will be restored automatically."}
      </motion.p>

      {/* ── Verified Security Badge ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "#ecfdf5",
          border: "1px solid #a7f3d0",
          padding: "8px 18px",
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 650,
          color: "#065f46",
          marginBottom: 28,
        }}
      >
        <ShieldCheck size={16} color="#059669" />
        <span>All Student Records, Marks &amp; GPA Data Safe &bull; 100% Protected</span>
      </motion.div>

      {/* ── Live Check Button ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
      >
        <button
          type="button"
          onClick={handleStatusCheck}
          disabled={checking}
          className="gf-state-btn-primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 28px",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            background: "#2563eb",
            color: "#ffffff",
            border: "none",
            cursor: checking ? "not-allowed" : "pointer",
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.28)",
            outline: "none",
          }}
        >
          <RefreshCw size={16} className={checking ? "gf-spin" : ""} />
          <span>{checking ? "Testing Connection..." : "Check Status & Refresh"}</span>
        </button>

        {feedback && (
          <span style={{ fontSize: 12.5, color: "#64748b", marginTop: 4 }}>
            {feedback}
          </span>
        )}
      </motion.div>
    </div>
  );
}
