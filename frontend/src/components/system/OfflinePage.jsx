import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  WifiOff,
  RefreshCw,
  Home as HomeIcon,
  Zap,
  CheckCircle2,
  Signal,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function OfflinePage({ onRetry }) {
  const { hasActiveSession, currentRegNo } = useApp();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/favicon.ico?t=" + Date.now(), { method: "HEAD", cache: "no-store" });
      if (res.ok) {
        setTestResult("online");
        if (onRetry) onRetry();
        else window.location.reload();
      } else {
        setTestResult("offline");
      }
    } catch {
      setTestResult("offline");
    } finally {
      setTimeout(() => setTesting(false), 800);
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
      {/* ── Animated Disconnected Wireless Cloud SVG ── */}
      <div style={{ width: "100%", maxWidth: 300, height: 180, marginBottom: 24, position: "relative" }}>
        <svg viewBox="0 0 300 180" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          {/* Cloud Outline */}
          <path
            d="M90 120 C70 120 55 105 55 85 C55 68 68 54 85 52 C92 32 112 18 136 18 C165 18 189 38 193 66 C209 68 222 82 222 98 C222 116 208 120 190 120 Z"
            fill="#f1f5f9"
            stroke="#cbd5e1"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Wi-Fi Pulse Rings */}
          <path d="M110 95 Q150 70 190 95" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
          <path d="M125 108 Q150 90 175 108" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
          <circle cx="150" cy="120" r="4" fill="#f59e0b" />
        </svg>

        {/* Floating Pulsing Signal Icon */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: 24,
            left: "50%",
            transform: "translateX(-50%)",
            width: 44,
            height: 44,
            borderRadius: 14,
            background: "#fffbeb",
            border: "1.5px solid #fde68a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#d97706",
            boxShadow: "0 6px 16px rgba(245, 158, 11, 0.2)",
          }}
        >
          <WifiOff size={22} />
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
        NETWORK DISCONNECTED &bull; WORKING OFFLINE
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
        No Internet Connection Found
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
        You appear to be offline. Any previously loaded student records remain cached and readable.
        Check your Wi-Fi or mobile data to sync live grades.
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
          onClick={handleTestConnection}
          disabled={testing}
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
            cursor: testing ? "not-allowed" : "pointer",
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.28)",
          }}
        >
          <RefreshCw size={16} className={testing ? "gf-spin" : ""} />
          <span>{testing ? "Testing Ping..." : "Test Connection & Retry"}</span>
        </button>

        {hasActiveSession && (
          <Link
            to={`/dashboard/${currentRegNo}`}
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
            <span>Open Cached Dashboard</span>
          </Link>
        )}
      </motion.div>

      {testResult === "offline" && (
        <span style={{ fontSize: 13, color: "#dc2626", marginTop: 16, fontWeight: 600 }}>
          ⚠️ Still unable to reach GradeFlow servers. Please check your network.
        </span>
      )}
    </div>
  );
}
