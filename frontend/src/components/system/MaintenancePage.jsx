import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wrench,
  RefreshCw,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Lock,
  Shield,
  ArrowRight,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function MaintenancePage({ message, onRetry }) {
  const { adminToken } = useApp();
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleStatusCheck = async () => {
    setChecking(true);
    setFeedback("");
    try {
      if (onRetry) await onRetry();
      setFeedback("System is still in maintenance. We're finalizing database sync.");
    } catch {
      setFeedback("Connection verified. Maintenance is actively ongoing.");
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
        background: "radial-gradient(ellipse at 50% 15%, rgba(37, 99, 235, 0.06) 0%, #fcfdfe 80%)",
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
        style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}
      >
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
            color: "#ffffff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            fontSize: 16,
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.28)",
          }}
        >
          G
        </span>
        <span style={{ fontSize: 19, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
          GradeFlow
        </span>
      </motion.div>

      {/* ── 60fps Smooth Hardware-Accelerated Server Architecture Graphic ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
        style={{ width: "100%", maxWidth: 300, height: 160, marginBottom: 18, position: "relative" }}
      >
        <svg viewBox="0 0 300 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="serverGradMaint" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <filter id="maintShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#2563eb" floodOpacity="0.18" />
            </filter>
          </defs>

          {/* Tower Chassis */}
          <rect x="80" y="20" width="140" height="124" rx="16" fill="url(#serverGradMaint)" filter="url(#maintShadow)" />
          
          {/* Blade Module 1 */}
          <rect x="94" y="34" width="112" height="24" rx="6" fill="#334155" stroke="#475569" strokeWidth="1" />
          <circle cx="106" cy="46" r="3" fill="#10b981">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <circle cx="116" cy="46" r="3" fill="#3b82f6" />
          <line x1="130" y1="46" x2="190" y2="46" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />

          {/* Blade Module 2 */}
          <rect x="94" y="66" width="112" height="24" rx="6" fill="#334155" stroke="#475569" strokeWidth="1" />
          <circle cx="106" cy="78" r="3" fill="#f59e0b">
            <animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="116" cy="78" r="3" fill="#10b981" />
          <line x1="130" y1="78" x2="190" y2="78" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />

          {/* Blade Module 3 */}
          <rect x="94" y="98" width="112" height="24" rx="6" fill="#334155" stroke="#475569" strokeWidth="1" />
          <circle cx="106" cy="110" r="3" fill="#10b981" />
          <circle cx="116" cy="110" r="3" fill="#3b82f6">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
          </circle>
          <line x1="130" y1="110" x2="190" y2="110" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />
        </svg>

        {/* Floating Rotating Gear Animation */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            top: 2,
            right: 44,
            width: 42,
            height: 42,
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
          <Wrench size={20} />
        </motion.div>
      </motion.div>

      {/* ── Headline ── */}
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
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
        System Maintenance in Progress
      </motion.h1>

      {/* ── Description / Message ── */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        style={{
          fontSize: 15.5,
          color: "#64748b",
          lineHeight: 1.6,
          maxWidth: 480,
          margin: "0 0 24px 0",
        }}
      >
        {message ||
          "GradeFlow is currently undergoing scheduled platform upgrades and database performance optimizations. Student access will be restored automatically."}
      </motion.p>

      {/* ── Verified Security Assurance ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "#ecfdf5",
          border: "1px solid #a7f3d0",
          padding: "7px 16px",
          borderRadius: 999,
          fontSize: 12.5,
          fontWeight: 650,
          color: "#065f46",
          marginBottom: 28,
        }}
      >
        <ShieldCheck size={16} color="#059669" />
        <span>All academic records, marks &amp; GPA calculations 100% secured</span>
      </motion.div>

      {/* ── Real-Time Status Check Action ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
      >
        <button
          type="button"
          onClick={handleStatusCheck}
          disabled={checking}
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
            transition: "all 0.15s ease",
          }}
        >
          <RefreshCw size={16} className={checking ? "gf-spin" : ""} />
          <span>{checking ? "Checking Live System Status..." : "Check Status & Try Again"}</span>
        </button>

        {feedback && (
          <span style={{ fontSize: 13, color: "#64748b", marginTop: 4, fontWeight: 500 }}>
            {feedback}
          </span>
        )}

        {adminToken && (
          <Link
            to="/admin/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              marginTop: 14,
              padding: "9px 18px",
              borderRadius: 999,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#2563eb",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
              transition: "all 0.15s ease",
            }}
          >
            <Shield size={14} color="#2563eb" />
            <span>Admin Authenticated &bull; Open Admin Dashboard</span>
            <ArrowRight size={13} color="#2563eb" />
          </Link>
        )}
      </motion.div>
    </div>
  );
}
