import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { RefreshCw, Home as HomeIcon } from "lucide-react";

export default function ServiceUnavailablePage({ onRetry }) {
  const [refreshing, setRefreshing] = useState(false);
  const [autoChecking, setAutoChecking] = useState(false);
  const mountedRef = useRef(true);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch (_) {}

    try {
      if (onRetry) await onRetry();
      else {
        const url = new URL(window.location.href);
        url.searchParams.set("_r", String(Date.now()));
        window.location.replace(url.toString());
      }
    } finally {
      if (mountedRef.current) {
        setTimeout(() => setRefreshing(false), 800);
      }
    }
  }, [onRetry, refreshing]);

  // ─── Intelligent Auto-Recovery on Service Restore ───
  useEffect(() => {
    mountedRef.current = true;

    const checkServiceStatus = async () => {
      if (refreshing || !mountedRef.current) return;
      try {
        setAutoChecking(true);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);

        const res = await fetch("/api/health?_t=" + Date.now(), {
          method: "GET",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok && mountedRef.current) {
          handleRefresh();
        }
      } catch (_) {
        // Still unavailable
      } finally {
        if (mountedRef.current) {
          setAutoChecking(false);
        }
      }
    };

    // Poll every 6 seconds
    const interval = setInterval(checkServiceStatus, 6000);

    // Immediate check when student switches back to this tab
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkServiceStatus();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [handleRefresh, refreshing]);

  React.useEffect(() => {
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
        zIndex: 9999999,
        backgroundColor: "#ffffff",
        background: "radial-gradient(ellipse at 50% 15%, #fffbeb 0%, #ffffff 70%)",
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

      {/* ── Animated Cloud & Database Constellation Vector Graphic ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
        style={{ width: "100%", maxWidth: 300, height: 160, marginBottom: 20 }}
      >
        <svg viewBox="0 0 300 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>

          {/* Background Ambient Pulse Rings */}
          <circle cx="150" cy="80" r="64" stroke="#fef3c7" strokeWidth="1.5" strokeDasharray="4 6" />
          <circle cx="150" cy="80" r="48" stroke="#fde68a" strokeWidth="1.2" />

          {/* Primary Database Left */}
          <rect x="55" y="50" width="60" height="60" rx="10" fill="url(#cloudGrad)" stroke="#334155" strokeWidth="1.5" />
          <rect x="63" y="58" width="44" height="10" rx="3" fill="#10b981" />
          <rect x="63" y="74" width="44" height="10" rx="3" fill="#3b82f6" />
          <rect x="63" y="90" width="44" height="10" rx="3" fill="#f59e0b" />

          {/* Academic Remote Gateway Right */}
          <rect x="185" y="50" width="60" height="60" rx="10" fill="url(#cloudGrad)" stroke="#334155" strokeWidth="1.5" />
          <circle cx="215" cy="80" r="15" fill="#3b82f6" opacity="0.2" />
          <path d="M201 80 Q215 68 229 80" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="215" cy="80" r="3" fill="#60a5fa" />

          {/* Flowing Optical Sync Bridge */}
          <path d="M115 80 L185 80" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="5 5">
            <animate attributeName="stroke-dashoffset" values="0;20" dur="1s" repeatCount="indefinite" />
          </path>
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
        Service Unavailable (503)
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
          <span>Return to Home</span>
        </Link>
      </motion.div>

      {/* ── Auto-Recovery Status Indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        style={{
          marginTop: 24,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontSize: 12.5,
          color: "#94a3b8",
          fontWeight: 500,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            backgroundColor: autoChecking ? "#3b82f6" : "#22c55e",
            boxShadow: autoChecking ? "0 0 8px #3b82f6" : "0 0 6px rgba(34, 197, 94, 0.4)",
            display: "inline-block",
            transition: "all 0.3s ease",
          }}
        />
        <span>
          {autoChecking
            ? "Checking connection..."
            : "Auto-reconnecting when service is restored"}
        </span>
      </motion.div>
    </div>
  );
}
