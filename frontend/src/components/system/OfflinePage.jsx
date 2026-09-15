import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { RefreshCw, Home as HomeIcon, Wifi, ExternalLink, ShieldAlert } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { NEW_ORIGIN } from "../../utils/domainHelper";

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
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch("/favicon.svg?t=" + Date.now(), {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeout);
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
        background: "radial-gradient(ellipse at 50% 15%, #eff6ff 0%, #f8fafc 55%, #ffffff 100%)",
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "32px 18px",
        boxSizing: "border-box",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflowY: "auto",
      }}
      role="alert"
      aria-live="polite"
    >
      <div style={{ maxWidth: 520, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* ── Brand Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}
        >
          <img
            src="/webisteLogo.png"
            alt="GradeFlow Logo"
            style={{
              height: 36,
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
          style={{ width: "100%", maxWidth: 280, height: 135, marginBottom: 14 }}
        >
          <svg viewBox="0 0 320 170" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
            <defs>
              <linearGradient id="satDishGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
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

            {/* Pulsing Signal Beacons */}
            <path d="M142 42 C154 34 166 34 178 42" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round">
              <animate attributeName="opacity" values="0.2;1;0.2" dur="1.5s" repeatCount="indefinite" />
            </path>
            <path d="M132 30 C150 18 170 18 188 30" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round">
              <animate attributeName="opacity" values="0.1;0.8;0.1" dur="1.8s" repeatCount="indefinite" />
            </path>

            {/* WiFi Disconnect Diagonal Slash */}
            <line x1="126" y1="120" x2="194" y2="40" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" opacity="0.85" />
          </svg>
        </motion.div>

        {/* ── Status Pill ── */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 12px",
            borderRadius: 9999,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: "0.03em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: "#ef4444",
            }}
          />
          <span>Network Unreachable</span>
        </div>

        {/* ── Headline ── */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          style={{
            fontSize: "clamp(22px, 4vw, 27px)",
            fontWeight: 800,
            color: "#0f172a",
            margin: "0 0 8px 0",
            letterSpacing: "-0.03em",
            lineHeight: 1.25,
          }}
        >
          Campus / Slow Network Detected
        </motion.h1>

        {/* ── Subtitle ── */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          style={{
            fontSize: 14,
            color: "#475569",
            lineHeight: 1.55,
            maxWidth: 460,
            margin: "0 0 18px 0",
          }}
        >
          Unable to reach GradeFlow server. College Wi-Fi firewalls frequently block high-traffic educational portals, resulting in <strong>"This site can't be reached"</strong>.
        </motion.p>

        {/* ── College Wi-Fi / Hotspot Recommendation Card ── */}
        <div
          style={{
            width: "100%",
            background: "#ffffff",
            border: "1px solid #bfdbfe",
            borderRadius: 13,
            padding: "14px 16px",
            textAlign: "left",
            marginBottom: 18,
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              fontWeight: 750,
              color: "#1d4ed8",
              marginBottom: 4,
            }}
          >
            <Wifi size={16} strokeWidth={2.4} />
            <span>Recommended: Switch to Mobile Hotspot</span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
            Turn off College Wi-Fi and switch to your <strong>Mobile Data / Personal Hotspot (5G/4G)</strong> for instant speed, 100% uptime, and zero firewall restrictions.
          </p>
        </div>

        {/* ── Actions ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          style={{ display: "flex", flexDirection: "column", gap: 9, width: "100%", maxWidth: 400, marginBottom: 18 }}
        >
          {/* Primary Action: Direct link to upgraded new origin */}
          <a
            href={NEW_ORIGIN}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              padding: "11px 18px",
              borderRadius: 10,
              fontSize: 13.5,
              fontWeight: 700,
              background: "#2563eb",
              color: "#ffffff",
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)",
              transition: "all 0.15s ease",
            }}
          >
            <ExternalLink size={15} strokeWidth={2.4} />
            <span>Open Upgraded Server (grade-flow-six)</span>
          </a>

          {/* Secondary Action: Retry Connection */}
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              padding: "10px 18px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 650,
              background: "#ffffff",
              color: "#334155",
              border: "1px solid #cbd5e1",
              cursor: testing ? "not-allowed" : "pointer",
              outline: "none",
              transition: "all 0.15s ease",
            }}
          >
            <RefreshCw size={14} className={testing ? "gf-spin" : ""} />
            <span>{testing ? "Testing Connection..." : "Test Connection & Retry"}</span>
          </button>

          {/* Tertiary Action: Return to cached home */}
          <Link
            to={hasActiveSession ? `/dashboard/${currentRegNo}` : "/"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              color: "#64748b",
              textDecoration: "none",
            }}
          >
            <HomeIcon size={14} />
            <span>{hasActiveSession ? "View Cached Dashboard" : "Return to Home Page"}</span>
          </Link>
        </motion.div>

        {testResult === "offline" && (
          <span style={{ fontSize: 12.5, color: "#dc2626", marginBottom: 14, fontWeight: 600 }}>
            Still unreachable on current network. Please switch to your Mobile Hotspot.
          </span>
        )}

        {/* ── Quick Troubleshooting Tips ── */}
        <div
          style={{
            width: "100%",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 11,
            padding: "12px 14px",
            textAlign: "left",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 750,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 6,
            }}
          >
            Quick Troubleshooting Tips
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, fontSize: 11.5, color: "#475569", lineHeight: 1.6 }}>
            <li>• <strong>Switch Network:</strong> Disconnect college Wi-Fi and use personal mobile data.</li>
            <li>• <strong>Private DNS:</strong> Set Private DNS to <code>1dot1dot1dot1.cloudflare-dns.com</code> to bypass campus DNS filters.</li>
            <li>• <strong>Bookmark New Link:</strong> Use <code>grade-flow-six.vercel.app</code> directly.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
