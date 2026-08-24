import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { RefreshCw, Home as HomeIcon } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function OfflinePage({ onRetry }) {
  const { studentSession } = useApp();
  const hasActiveSession = Boolean(studentSession?.regNo);
  const currentRegNo = studentSession?.regNo || "";

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Lock body scroll while offline overlay is active
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

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
        position: "fixed",
        inset: 0,
        zIndex: 9999999,
        backgroundColor: "#ffffff",
        background: "radial-gradient(ellipse at 50% 15%, #eff6ff 0%, #ffffff 70%)",
        minHeight: "100vh",
        width: "100vw",
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

      {/* ── 60fps Smooth Animated Satellite & Signal Pulse Vector Graphic ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
        style={{ width: "100%", maxWidth: 320, height: 170, marginBottom: 20 }}
      >
        <svg viewBox="0 0 320 170" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="satDishGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <radialGradient id="signalWave" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Concentric Search Radar Waves */}
          <circle cx="160" cy="95" r="70" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4 6">
            <animate attributeName="r" values="45;75;45" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="160" cy="95" r="50" stroke="#bfdbfe" strokeWidth="1.5" strokeDasharray="3 4">
            <animate attributeName="r" values="30;55;30" dur="2.4s" repeatCount="indefinite" />
          </circle>

          {/* Ground Station Base */}
          <ellipse cx="160" cy="142" rx="44" ry="10" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="160" y1="110" x2="160" y2="140" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
          <line x1="148" y1="138" x2="160" y2="120" stroke="#64748b" strokeWidth="2.5" />
          <line x1="172" y1="138" x2="160" y2="120" stroke="#64748b" strokeWidth="2.5" />

          {/* Parabolic Satellite Dish */}
          <path
            d="M125 76 C125 106 195 106 195 76"
            stroke="#1e293b"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          <line x1="160" y1="91" x2="160" y2="58" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="160" cy="56" r="5" fill="#2563eb" />

          {/* Animated Pulsing Signal Beacons */}
          <path d="M142 42 C154 34 166 34 178 42" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round">
            <animate attributeName="opacity" values="0.2;1;0.2" dur="1.5s" repeatCount="indefinite" />
          </path>
          <path d="M132 30 C150 18 170 18 188 30" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round">
            <animate attributeName="opacity" values="0.1;0.8;0.1" dur="1.8s" repeatCount="indefinite" />
          </path>

          {/* WiFi Disconnect Diagonal Slash */}
          <line x1="126" y1="120" x2="194" y2="40" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" opacity="0.75" />
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
        No Internet Connection
      </motion.h1>

      {/* ── Subtitle ── */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        style={{
          fontSize: 15,
          color: "#64748b",
          lineHeight: 1.6,
          maxWidth: 480,
          margin: "0 0 28px 0",
        }}
      >
        Your device seems to be offline. Check your network cables, Wi-Fi, or mobile data connection and try again.
      </motion.p>

      {/* ── Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}
      >
        <button
          type="button"
          onClick={handleTestConnection}
          disabled={testing}
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
            outline: "none",
            transition: "all 0.15s ease",
          }}
        >
          <RefreshCw size={15} className={testing ? "gf-spin" : ""} />
          <span>{testing ? "Testing Connection..." : "Check Connection & Retry"}</span>
        </button>

        <Link
          to={hasActiveSession ? `/dashboard/${currentRegNo}` : "/"}
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
          <span>{hasActiveSession ? "View Cached Dashboard" : "Return to Home"}</span>
        </Link>
      </motion.div>

      {testResult === "offline" && (
        <span style={{ fontSize: 13, color: "#ef4444", marginTop: 14, fontWeight: 600 }}>
          Still offline. Please check your internet connection.
        </span>
      )}
    </div>
  );
}
