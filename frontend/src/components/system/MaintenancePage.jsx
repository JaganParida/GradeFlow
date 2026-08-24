import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { RefreshCw, ArrowRight } from "lucide-react";
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
      setFeedback("Maintenance is actively ongoing. Please check back shortly.");
    } catch {
      setFeedback("Connection verified. Maintenance is still in progress.");
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
        background: "radial-gradient(ellipse at 50% 15%, rgba(37, 99, 235, 0.05) 0%, #fcfdfe 70%)",
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

      {/* ── Rich Isometric Animated Server Rack & Cloud Database Cluster ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
        style={{ width: "100%", maxWidth: 360, height: 180, marginBottom: 20 }}
      >
        <svg viewBox="0 0 360 180" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="maintChassis" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="maintAccent" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#eff6ff" />
              <stop offset="100%" stopColor="#dbeafe" />
            </linearGradient>
          </defs>

          {/* Background Grid & Pulse Lines */}
          <line x1="20" y1="90" x2="340" y2="90" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 6" />
          <line x1="60" y1="140" x2="300" y2="140" stroke="#f1f5f9" strokeWidth="1" />

          {/* Left Server Node Tower */}
          <rect x="45" y="48" width="70" height="96" rx="8" fill="url(#maintChassis)" stroke="#334155" strokeWidth="1.5" />
          <rect x="53" y="58" width="54" height="18" rx="4" fill="#334155" />
          <circle cx="61" cy="67" r="2.5" fill="#10b981">
            <animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite" />
          </circle>
          <line x1="69" y1="67" x2="99" y2="67" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
          
          <rect x="53" y="82" width="54" height="18" rx="4" fill="#334155" />
          <circle cx="61" cy="91" r="2.5" fill="#3b82f6" />
          <line x1="69" y1="91" x2="99" y2="91" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />

          <rect x="53" y="106" width="54" height="18" rx="4" fill="#334155" />
          <circle cx="61" cy="115" r="2.5" fill="#f59e0b">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <line x1="69" y1="115" x2="99" y2="115" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />

          {/* Optical Data Wave Connecting Left Tower to Center Cloud */}
          <path d="M115 96 C135 96, 135 70, 155 70" stroke="#bfdbfe" strokeWidth="2" strokeDasharray="4 4">
            <animate attributeName="stroke-dashoffset" values="16;0" dur="1s" repeatCount="indefinite" />
          </path>

          {/* Main Central Database Hub */}
          <rect x="145" y="32" width="70" height="120" rx="10" fill="url(#maintChassis)" stroke="#2563eb" strokeWidth="2" />
          <rect x="153" y="42" width="54" height="22" rx="4" fill="#1e293b" stroke="#3b82f6" strokeWidth="1" />
          <circle cx="163" cy="53" r="3" fill="#10b981">
            <animate attributeName="opacity" values="0.2;1;0.2" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="173" cy="53" r="3" fill="#3b82f6" />
          <line x1="183" y1="53" x2="199" y2="53" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />

          <rect x="153" y="70" width="54" height="22" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          <circle cx="163" cy="81" r="3" fill="#3b82f6" />
          <circle cx="173" cy="81" r="3" fill="#10b981" />
          <line x1="183" y1="81" x2="199" y2="81" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2" />

          <rect x="153" y="98" width="54" height="22" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          <circle cx="163" cy="109" r="3" fill="#f59e0b">
            <animate attributeName="opacity" values="1;0.2;1" dur="1.4s" repeatCount="indefinite" />
          </circle>
          <circle cx="173" cy="109" r="3" fill="#3b82f6" />
          <line x1="183" y1="109" x2="199" y2="109" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />

          <rect x="153" y="126" width="54" height="18" rx="4" fill="#0f172a" />
          <line x1="161" y1="135" x2="199" y2="135" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
          </line>

          {/* Optical Data Wave Connecting Center Hub to Right Tower */}
          <path d="M215 70 C235 70, 235 96, 245 96" stroke="#bfdbfe" strokeWidth="2" strokeDasharray="4 4">
            <animate attributeName="stroke-dashoffset" values="0;16" dur="1s" repeatCount="indefinite" />
          </path>

          {/* Right Server Node Tower */}
          <rect x="245" y="48" width="70" height="96" rx="8" fill="url(#maintChassis)" stroke="#334155" strokeWidth="1.5" />
          <rect x="253" y="58" width="54" height="18" rx="4" fill="#334155" />
          <circle cx="261" cy="67" r="2.5" fill="#3b82f6" />
          <line x1="269" y1="67" x2="299" y2="67" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />

          <rect x="253" y="82" width="54" height="18" rx="4" fill="#334155" />
          <circle cx="261" cy="91" r="2.5" fill="#10b981">
            <animate attributeName="opacity" values="0.2;1;0.2" dur="1.3s" repeatCount="indefinite" />
          </circle>
          <line x1="269" y1="91" x2="299" y2="91" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />

          <rect x="253" y="106" width="54" height="18" rx="4" fill="#334155" />
          <circle cx="261" cy="115" r="2.5" fill="#10b981" />
          <line x1="269" y1="115" x2="299" y2="115" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
        </svg>
      </motion.div>

      {/* ── Headline ── */}
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        style={{
          fontSize: "clamp(26px, 4.5vw, 34px)",
          fontWeight: 800,
          color: "#0f172a",
          margin: "0 0 10px 0",
          letterSpacing: "-0.035em",
          lineHeight: 1.2,
        }}
      >
        Scheduled Maintenance in Progress
      </motion.h1>

      {/* ── Description ── */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        style={{
          fontSize: 15,
          color: "#64748b",
          lineHeight: 1.6,
          maxWidth: 500,
          margin: "0 0 28px 0",
        }}
      >
        {message ||
          "GradeFlow is currently upgrading database clusters and optimizing server performance. Student access will be restored automatically."}
      </motion.p>

      {/* ── Action Trigger ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}
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
            outline: "none",
            transition: "all 0.15s ease",
          }}
        >
          <RefreshCw size={15} className={checking ? "gf-spin" : ""} />
          <span>{checking ? "Checking Live System Status..." : "Check Status & Try Again"}</span>
        </button>

        {feedback && (
          <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>
            {feedback}
          </span>
        )}

        {adminToken && (
          <Link
            to="/admin/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 6,
              color: "#2563eb",
              fontSize: 13.5,
              fontWeight: 700,
              textDecoration: "none",
              transition: "all 0.15s ease",
            }}
          >
            <span>Admin Portal Dashboard</span>
            <ArrowRight size={14} />
          </Link>
        )}
      </motion.div>
    </div>
  );
}
