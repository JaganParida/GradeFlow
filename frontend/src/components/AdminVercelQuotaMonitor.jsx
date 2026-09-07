import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Activity,
  Server,
  HardDrive,
  Clock,
  Calendar,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  TrendingUp,
  Layers,
  ArrowRight,
  Info,
  Check,
  X,
} from "lucide-react";

export default function AdminVercelQuotaMonitor({ API, authHeaders, isMobile: propIsMobile }) {
  const [internalIsMobile, setInternalIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setInternalIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = propIsMobile !== undefined ? propIsMobile : internalIsMobile;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [applyingPolicy, setApplyingPolicy] = useState(null);
  const [policyMessage, setPolicyMessage] = useState(null);
  const [activeHistogramHour, setActiveHistogramHour] = useState(null);

  // Fetch Vercel Quota metrics strictly ON-DEMAND (Zero background polling / zero quota drain)
  const fetchQuotaMetrics = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await axios.get(`${API}/admin/vercel-quota`, {
        headers: authHeaders,
        withCredentials: true,
      });

      if (res.data?.success) {
        setData(res.data);
      } else {
        setError(res.data?.message || "Failed to load Vercel Quota metrics.");
      }
    } catch (err) {
      console.error("Error fetching Vercel Quota:", err);
      setError(
        err.response?.data?.message ||
          "Unable to communicate with Vercel Quota Engine."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQuotaMetrics();
  }, []);

  const handleApplyPolicy = async (policyName) => {
    setApplyingPolicy(policyName);
    setPolicyMessage(null);
    try {
      const res = await axios.post(
        `${API}/admin/vercel-quota/apply-policy`,
        { policy: policyName },
        { headers: authHeaders, withCredentials: true }
      );
      if (res.data?.success) {
        setPolicyMessage({
          type: "success",
          text: `Applied ${policyName.replace("_", " ")} defense policy successfully!`,
        });
        await fetchQuotaMetrics(true);
      } else {
        setPolicyMessage({
          type: "error",
          text: res.data?.message || "Failed to apply defense policy.",
        });
      }
    } catch (err) {
      setPolicyMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          "Error updating auto-defense settings.",
      });
    } finally {
      setApplyingPolicy(null);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
          padding: isMobile ? "32px 16px" : "48px 24px",
          textAlign: "center",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "#f5f3ff",
            color: "#7c3aed",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <RefreshCw size={22} className="spin" />
        </div>
        <h3
          style={{
            fontSize: isMobile ? 15 : 17,
            fontWeight: 800,
            color: "#0f172a",
            margin: "0 0 6px 0",
          }}
        >
          Calculating Vercel Hobby Quota & Telemetry...
        </h3>
        <p
          style={{
            fontSize: isMobile ? 11.5 : 13,
            color: "#64748b",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Querying on-demand serverless invocations, bandwidth, and peak usage hours.
        </p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div
        style={{
          background: "#ffffff",
          borderRadius: 16,
          border: "1px solid #fecaca",
          padding: isMobile ? "28px 16px" : "40px 24px",
          textAlign: "center",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "#fef2f2",
            color: "#dc2626",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          <AlertTriangle size={22} />
        </div>
        <h3
          style={{
            fontSize: isMobile ? 15 : 17,
            fontWeight: 800,
            color: "#0f172a",
            margin: "0 0 6px 0",
          }}
        >
          Failed to Calculate Quota Intelligence
        </h3>
        <p
          style={{
            fontSize: isMobile ? 11.5 : 13,
            color: "#64748b",
            margin: "0 0 16px 0",
          }}
        >
          {error}
        </p>
        <button
          onClick={() => fetchQuotaMetrics(true)}
          style={{
            padding: "8px 16px",
            background: "#0f172a",
            color: "#ffffff",
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <RefreshCw size={13} /> Retry Calculation
        </button>
      </div>
    );
  }

  const { today, month, bandwidth, peakTiming, routeBreakdown, defenseSystem, timestamp } = data;

  const maxHistogramRequests = Math.max(
    1,
    ...(peakTiming?.hourlyDistribution?.map((h) => h.requests) || [1])
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 14 : 20,
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      {/* ── 1. HEADER BANNER: ZERO-DRAIN ARCHITECTURE & REFRESH ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
          borderRadius: isMobile ? 14 : 18,
          border: "1px solid #1e293b",
          padding: isMobile ? "14px 14px" : "20px 24px",
          color: "#ffffff",
          boxShadow: "0 4px 20px rgba(15, 23, 42, 0.12)",
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -30,
            bottom: -30,
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "rgba(139, 92, 246, 0.15)",
            filter: "blur(32px)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            gap: isMobile ? 12 : 16,
            position: "relative",
            zIndex: 2,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: "rgba(139, 92, 246, 0.2)",
                  border: "1px solid rgba(139, 92, 246, 0.4)",
                  color: "#c4b5fd",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Zap size={16} />
              </div>

              <h2
                style={{
                  fontSize: isMobile ? 16 : 19,
                  fontWeight: 800,
                  letterSpacing: "-0.3px",
                  margin: 0,
                  color: "#ffffff",
                }}
              >
                Vercel Free Hobby Quota & Traffic Engine
              </h2>

              <span
                style={{
                  padding: "2px 8px",
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 20,
                  background: "rgba(16, 185, 129, 0.2)",
                  color: "#6ee7b7",
                  border: "1px solid rgba(16, 185, 129, 0.35)",
                  whiteSpace: "nowrap",
                }}
              >
                Zero-Drain Mode
              </span>
            </div>

            <p
              style={{
                fontSize: isMobile ? 11 : 12.5,
                color: "#cbd5e1",
                margin: 0,
                lineHeight: 1.5,
                maxWidth: 680,
              }}
            >
              Real-time calculations computed strictly{" "}
              <strong style={{ color: "#ffffff" }}>on-demand</strong> when you visit this page. Zero periodic polling intervals to protect your 100,000 monthly serverless quota.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: isMobile ? "100%" : "auto",
              justifyContent: isMobile ? "space-between" : "flex-end",
            }}
          >
            <div style={{ textAlign: isMobile ? "left" : "right" }}>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>Calculated At</div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "#f1f5f9" }}>
                {timestamp
                  ? new Date(timestamp).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : "Just now"}
              </div>
            </div>

            <button
              onClick={() => fetchQuotaMetrics(true)}
              disabled={refreshing}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: isMobile ? "8px 14px" : "9px 16px",
                background: "rgba(255, 255, 255, 0.12)",
                hover: "rgba(255, 255, 255, 0.2)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                borderRadius: 11,
                color: "#ffffff",
                fontSize: isMobile ? 11.5 : 12.5,
                fontWeight: 700,
                cursor: refreshing ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
                flexShrink: 0,
              }}
            >
              <RefreshCw
                size={13}
                style={{
                  animation: refreshing ? "spin 1s linear infinite" : "none",
                  color: "#c4b5fd",
                }}
              />
              <span>{refreshing ? "Calculating..." : "Refresh Metrics"}</span>
            </button>
          </div>
        </div>

        {/* Policy Feedback Alert */}
        {policyMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: 12,
              padding: "9px 12px",
              borderRadius: 10,
              fontSize: 11.5,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background:
                policyMessage.type === "success"
                  ? "rgba(6, 78, 59, 0.7)"
                  : "rgba(136, 19, 55, 0.7)",
              border:
                policyMessage.type === "success"
                  ? "1px solid rgba(52, 211, 153, 0.4)"
                  : "1px solid rgba(251, 113, 133, 0.4)",
              color: policyMessage.type === "success" ? "#a7f3d0" : "#fecdd3",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {policyMessage.type === "success" ? (
                <CheckCircle2 size={15} color="#34d399" />
              ) : (
                <AlertTriangle size={15} color="#fb7185" />
              )}
              <span>{policyMessage.text}</span>
            </div>
            <button
              onClick={() => setPolicyMessage(null)}
              style={{
                background: "transparent",
                border: "none",
                color: "#cbd5e1",
                cursor: "pointer",
                fontSize: 12,
                padding: "0 4px",
              }}
            >
              ✕
            </button>
          </motion.div>
        )}
      </div>

      {/* ── 2. TOP 4 KEY KPI METRICS CARDS ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "repeat(2, minmax(0, 1fr))"
            : "repeat(4, minmax(0, 1fr))",
          gap: isMobile ? 10 : 14,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* CARD 1: TODAY'S REQUESTS */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: isMobile ? 14 : 16,
            padding: isMobile ? "12px 12px" : "16px 18px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
            minWidth: 0,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: isMobile ? 10 : 11,
                  fontWeight: 800,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Today's Invocations
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "1px 6px",
                  borderRadius: 12,
                  whiteSpace: "nowrap",
                  background:
                    today.status === "CRITICAL"
                      ? "#fef2f2"
                      : today.status === "WARNING"
                      ? "#fffbeb"
                      : "#ecfdf5",
                  color:
                    today.status === "CRITICAL"
                      ? "#dc2626"
                      : today.status === "WARNING"
                      ? "#d97706"
                      : "#059669",
                  border:
                    today.status === "CRITICAL"
                      ? "1px solid #fecaca"
                      : today.status === "WARNING"
                      ? "1px solid #fde68a"
                      : "1px solid #a7f3d0",
                }}
              >
                {today.percent}% of Day
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 5,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: isMobile ? 20 : 26,
                  fontWeight: 900,
                  color: "#0f172a",
                  lineHeight: 1,
                  letterSpacing: "-0.5px",
                }}
              >
                {today.used.toLocaleString()}
              </span>
              <span
                style={{
                  fontSize: isMobile ? 10.5 : 12,
                  fontWeight: 600,
                  color: "#94a3b8",
                  whiteSpace: "nowrap",
                }}
              >
                / {today.budget.toLocaleString()} reqs
              </span>
            </div>

            {/* Progress bar */}
            <div
              style={{
                width: "100%",
                height: 5,
                borderRadius: 4,
                background: "#f1f5f9",
                marginTop: 10,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, Math.max(2, today.percent))}%`,
                  height: "100%",
                  borderRadius: 4,
                  background:
                    today.percent >= 90
                      ? "#ef4444"
                      : today.percent >= 70
                      ? "#f59e0b"
                      : "#10b981",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>

          <div
            style={{
              fontSize: isMobile ? 10 : 11.5,
              color: "#64748b",
              marginTop: 10,
              paddingTop: 8,
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Remaining:</span>
            <span style={{ fontWeight: 700, color: "#0f172a" }}>
              {today.remaining.toLocaleString()} left
            </span>
          </div>
        </div>

        {/* CARD 2: MONTHLY QUOTA */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: isMobile ? 14 : 16,
            padding: isMobile ? "12px 12px" : "16px 18px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
            minWidth: 0,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: isMobile ? 10 : 11,
                  fontWeight: 800,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Monthly Quota
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "1px 6px",
                  borderRadius: 12,
                  whiteSpace: "nowrap",
                  background:
                    month.projectionStatus === "OVER_BUDGET"
                      ? "#fef2f2"
                      : month.projectionStatus === "AT_RISK"
                      ? "#fffbeb"
                      : "#f5f3ff",
                  color:
                    month.projectionStatus === "OVER_BUDGET"
                      ? "#dc2626"
                      : month.projectionStatus === "AT_RISK"
                      ? "#d97706"
                      : "#7c3aed",
                  border:
                    month.projectionStatus === "OVER_BUDGET"
                      ? "1px solid #fecaca"
                      : month.projectionStatus === "AT_RISK"
                      ? "1px solid #fde68a"
                      : "1px solid #ddd6fe",
                }}
              >
                {month.percent}% Used
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 5,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: isMobile ? 20 : 26,
                  fontWeight: 900,
                  color: "#0f172a",
                  lineHeight: 1,
                  letterSpacing: "-0.5px",
                }}
              >
                {month.used.toLocaleString()}
              </span>
              <span
                style={{
                  fontSize: isMobile ? 10.5 : 12,
                  fontWeight: 600,
                  color: "#94a3b8",
                  whiteSpace: "nowrap",
                }}
              >
                / {month.limit.toLocaleString()}
              </span>
            </div>

            {/* Progress bar */}
            <div
              style={{
                width: "100%",
                height: 5,
                borderRadius: 4,
                background: "#f1f5f9",
                marginTop: 10,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, Math.max(2, month.percent))}%`,
                  height: "100%",
                  borderRadius: 4,
                  background:
                    month.percent >= 90
                      ? "#ef4444"
                      : month.percent >= 70
                      ? "#f59e0b"
                      : "#7c3aed",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>

          <div
            style={{
              fontSize: isMobile ? 10 : 11.5,
              color: "#64748b",
              marginTop: 10,
              paddingTop: 8,
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <span>Projected End:</span>
            <span
              style={{
                fontWeight: 700,
                color:
                  month.projectionStatus === "OVER_BUDGET"
                    ? "#dc2626"
                    : month.projectionStatus === "AT_RISK"
                    ? "#d97706"
                    : "#0f172a",
              }}
            >
              ~{month.projectedMonthEndRequests.toLocaleString()} ({month.projectedMonthPercent}%)
            </span>
          </div>
        </div>

        {/* CARD 3: FAST DATA TRANSFER (BANDWIDTH) */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: isMobile ? 14 : 16,
            padding: isMobile ? "12px 12px" : "16px 18px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
            minWidth: 0,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: isMobile ? 10 : 11,
                  fontWeight: 800,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Origin Bandwidth
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "1px 6px",
                  borderRadius: 12,
                  whiteSpace: "nowrap",
                  background: "#ecfeff",
                  color: "#0891b2",
                  border: "1px solid #a5f3fc",
                }}
              >
                {bandwidth.percent}% of 100GB
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 5,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: isMobile ? 20 : 26,
                  fontWeight: 900,
                  color: "#0f172a",
                  lineHeight: 1,
                  letterSpacing: "-0.5px",
                }}
              >
                {bandwidth.usedGB}
              </span>
              <span
                style={{
                  fontSize: isMobile ? 10.5 : 12,
                  fontWeight: 600,
                  color: "#94a3b8",
                  whiteSpace: "nowrap",
                }}
              >
                / {bandwidth.limitGB} GB
              </span>
            </div>

            {/* Progress bar */}
            <div
              style={{
                width: "100%",
                height: 5,
                borderRadius: 4,
                background: "#f1f5f9",
                marginTop: 10,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, Math.max(2, bandwidth.percent))}%`,
                  height: "100%",
                  borderRadius: 4,
                  background: "#06b6d4",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>

          <div
            style={{
              fontSize: isMobile ? 10 : 11.5,
              color: "#64748b",
              marginTop: 10,
              paddingTop: 8,
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Hobby Balance:</span>
            <span style={{ fontWeight: 700, color: "#0f172a" }}>
              {bandwidth.remainingGB} GB free
            </span>
          </div>
        </div>

        {/* CARD 4: ENTERPRISE AUTO-DEFENSE */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: isMobile ? 14 : 16,
            padding: isMobile ? "12px 12px" : "16px 18px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
            minWidth: 0,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: isMobile ? 10 : 11,
                  fontWeight: 800,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Defense Engine
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "1px 6px",
                  borderRadius: 12,
                  whiteSpace: "nowrap",
                  background: defenseSystem.currentQueueEnabled ? "#fffbeb" : "#ecfdf5",
                  color: defenseSystem.currentQueueEnabled ? "#d97706" : "#059669",
                  border: defenseSystem.currentQueueEnabled ? "1px solid #fde68a" : "1px solid #a7f3d0",
                }}
              >
                {defenseSystem.currentQueueEnabled ? "Queue Active" : "Direct Pass"}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                margin: "4px 0 2px 0",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background:
                    defenseSystem.recommendedDefensePolicy === "CRITICAL_SHIELD"
                      ? "#ef4444"
                      : defenseSystem.recommendedDefensePolicy === "SURGE_PROTECTION"
                      ? "#f59e0b"
                      : "#10b981",
                  boxShadow: `0 0 8px ${
                    defenseSystem.recommendedDefensePolicy === "CRITICAL_SHIELD"
                      ? "#ef4444"
                      : defenseSystem.recommendedDefensePolicy === "SURGE_PROTECTION"
                      ? "#f59e0b"
                      : "#10b981"
                  }`,
                }}
              />
              <span
                style={{
                  fontSize: isMobile ? 13 : 15,
                  fontWeight: 800,
                  color: "#0f172a",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {defenseSystem.defenseBadge}
              </span>
            </div>

            <p
              style={{
                fontSize: isMobile ? 10 : 11,
                color: "#64748b",
                margin: "4px 0 0 0",
                lineHeight: 1.35,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {defenseSystem.defenseDescription}
            </p>
          </div>

          <div
            style={{
              fontSize: isMobile ? 10 : 11.5,
              color: "#64748b",
              marginTop: 10,
              paddingTop: 8,
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Capacity Cap:</span>
            <span style={{ fontWeight: 700, color: "#0f172a" }}>
              {defenseSystem.maxActiveCapacity} students
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. PEAK TIMING & TRAFFIC SURGE INTELLIGENCE ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: isMobile ? 14 : 18,
          padding: isMobile ? "14px 14px" : "20px 22px",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={18} color="#7c3aed" />
              <h3
                style={{
                  fontSize: isMobile ? 15 : 16,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                Peak Timing & Surge Intelligence
              </h3>
            </div>
            <p
              style={{
                fontSize: isMobile ? 11 : 12,
                color: "#64748b",
                margin: "4px 0 0 0",
              }}
            >
              Exact peak hour and day when student traffic surges highest, computed from 24-hour serverless telemetry.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              width: isMobile ? "100%" : "auto",
            }}
          >
            <div
              style={{
                padding: "6px 10px",
                background: "#f5f3ff",
                border: "1px solid #ddd6fe",
                borderRadius: 10,
                fontSize: isMobile ? 11 : 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ color: "#7c3aed", fontWeight: 600 }}>Peak Hour:</span>
              <span style={{ color: "#2e1065", fontWeight: 800 }}>
                {peakTiming?.peakHourText || "8:00 PM – 9:00 PM"}
              </span>
            </div>

            <div
              style={{
                padding: "6px 10px",
                background: "#eef2ff",
                border: "1px solid #c7d2fe",
                borderRadius: 10,
                fontSize: isMobile ? 11 : 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ color: "#4f46e5", fontWeight: 600 }}>Peak Day:</span>
              <span style={{ color: "#1e1b4b", fontWeight: 800 }}>
                {peakTiming?.peakDayText || "Tuesday"}
              </span>
            </div>
          </div>
        </div>

        {/* 24-Hour Bar Histogram */}
        <div style={{ marginTop: 8 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: isMobile ? 11 : 12,
                fontWeight: 700,
                color: "#475569",
              }}
            >
              24-Hour Request Volume Distribution (IST)
            </span>
            {activeHistogramHour !== null && (
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "#7c3aed",
                }}
              >
                {activeHistogramHour.label}: {activeHistogramHour.requests.toLocaleString()} reqs ({activeHistogramHour.percentage}%)
              </span>
            )}
          </div>

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: isMobile ? "12px 8px 8px 8px" : "16px 14px 10px 14px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                height: isMobile ? 110 : 140,
                display: "flex",
                alignItems: "flex-end",
                gap: isMobile ? 2 : 4,
                paddingBottom: 4,
              }}
            >
              {(peakTiming?.hourlyDistribution || []).map((h) => {
                const isPeak = h.hour === peakTiming.peakHourIndex;
                const heightPercent =
                  maxHistogramRequests > 0
                    ? Math.max(8, Math.round((h.requests / maxHistogramRequests) * 100))
                    : 8;

                return (
                  <div
                    key={h.hour}
                    onMouseEnter={() => setActiveHistogramHour(h)}
                    onMouseLeave={() => setActiveHistogramHour(null)}
                    style={{
                      flex: 1,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      cursor: "pointer",
                      position: "relative",
                    }}
                    title={`${h.label}: ${h.requests} requests`}
                  >
                    {isPeak && (
                      <span
                        style={{
                          fontSize: 10,
                          color: "#f59e0b",
                          fontWeight: 900,
                          marginBottom: 2,
                        }}
                      >
                        ★
                      </span>
                    )}

                    <div
                      style={{
                        width: "100%",
                        height: `${heightPercent}%`,
                        borderRadius: "4px 4px 0 0",
                        background: isPeak
                          ? "linear-gradient(180deg, #8b5cf6 0%, #6366f1 100%)"
                          : "#cbd5e1",
                        boxShadow: isPeak ? "0 2px 8px rgba(124, 58, 237, 0.3)" : "none",
                        transition: "all 0.15s ease",
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Time labels below histogram */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: isMobile ? 9 : 10.5,
                fontWeight: 700,
                color: "#64748b",
                paddingTop: 6,
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <span>12 AM</span>
              <span>3 AM</span>
              <span>6 AM</span>
              <span>9 AM</span>
              <span>12 PM</span>
              <span>3 PM</span>
              <span style={{ color: "#7c3aed", fontWeight: 900 }}>6 PM - 9 PM</span>
              <span>11 PM</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. ENTERPRISE AUTO-DEFENSE POLICIES (1-CLICK APPLY) ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
          border: "1px solid #c7d2fe",
          borderRadius: isMobile ? 14 : 18,
          padding: isMobile ? "14px 14px" : "20px 22px",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldCheck size={20} color="#4f46e5" />
              <h3
                style={{
                  fontSize: isMobile ? 15 : 16,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                Automated Traffic Defense Policies
              </h3>
            </div>
            <p
              style={{
                fontSize: isMobile ? 11 : 12,
                color: "#475569",
                margin: "4px 0 0 0",
                lineHeight: 1.45,
                maxWidth: 680,
              }}
            >
              GradeFlow uses smart traffic coalescing and priority virtual queueing to guarantee you never get 429 quota locked on Vercel's Free Hobby Tier.
            </p>
          </div>

          <span
            style={{
              padding: "4px 10px",
              background: "#4f46e5",
              color: "#ffffff",
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 20,
              whiteSpace: "nowrap",
            }}
          >
            Active: {defenseSystem.defenseBadge}
          </span>
        </div>

        {/* 3 PRE-SET POLICY CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
            gap: isMobile ? 10 : 14,
          }}
        >
          {/* 1. OPTIMAL MODE */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 14,
              border:
                defenseSystem.recommendedDefensePolicy === "OPTIMAL"
                  ? "2px solid #10b981"
                  : "1px solid #e2e8f0",
              padding: isMobile ? "12px 14px" : "16px 18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "2px 7px",
                    borderRadius: 6,
                    background: "#ecfdf5",
                    color: "#047857",
                    border: "1px solid #a7f3d0",
                  }}
                >
                  Normal Traffic (&lt;70%)
                </span>
                <CheckCircle2 size={16} color="#10b981" />
              </div>

              <h4
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: "4px 0 4px 0",
                }}
              >
                Optimal Speed Mode
              </h4>
              <p
                style={{
                  fontSize: 11.5,
                  color: "#64748b",
                  margin: 0,
                  lineHeight: 1.45,
                }}
              >
                Direct serverless invocation. Queue is turned off. Capacity cap set to 250 active students. Best user experience.
              </p>
            </div>

            <div
              style={{
                marginTop: 14,
                paddingTop: 10,
                borderTop: "1px solid #f1f5f9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 10.5, color: "#94a3b8" }}>Free Tier Safe</span>
              <button
                onClick={() => handleApplyPolicy("OPTIMAL")}
                disabled={applyingPolicy !== null}
                style={{
                  padding: "6px 12px",
                  background: "#10b981",
                  color: "#ffffff",
                  borderRadius: 8,
                  fontSize: 11.5,
                  fontWeight: 700,
                  border: "none",
                  cursor: applyingPolicy ? "not-allowed" : "pointer",
                  opacity: applyingPolicy ? 0.6 : 1,
                  transition: "all 0.15s ease",
                }}
              >
                {applyingPolicy === "OPTIMAL" ? "Applying..." : "Apply Mode"}
              </button>
            </div>
          </div>

          {/* 2. SURGE PROTECTION */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 14,
              border:
                defenseSystem.recommendedDefensePolicy === "SURGE_PROTECTION"
                  ? "2px solid #f59e0b"
                  : "1px solid #e2e8f0",
              padding: isMobile ? "12px 14px" : "16px 18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "2px 7px",
                    borderRadius: 6,
                    background: "#fffbeb",
                    color: "#b45309",
                    border: "1px solid #fde68a",
                  }}
                >
                  Elevated Surge (70%-90%)
                </span>
                <TrendingUp size={16} color="#f59e0b" />
              </div>

              <h4
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: "4px 0 4px 0",
                }}
              >
                Surge Protection Mode
              </h4>
              <p
                style={{
                  fontSize: 11.5,
                  color: "#64748b",
                  margin: 0,
                  lineHeight: 1.45,
                }}
              >
                Activates auto-queueing at 150 active students. Paces incoming requests and enforces aggressive Edge SWR caching.
              </p>
            </div>

            <div
              style={{
                marginTop: 14,
                paddingTop: 10,
                borderTop: "1px solid #f1f5f9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 10.5, color: "#94a3b8" }}>Protects 3.3k Budget</span>
              <button
                onClick={() => handleApplyPolicy("SURGE_PROTECTION")}
                disabled={applyingPolicy !== null}
                style={{
                  padding: "6px 12px",
                  background: "#f59e0b",
                  color: "#ffffff",
                  borderRadius: 8,
                  fontSize: 11.5,
                  fontWeight: 700,
                  border: "none",
                  cursor: applyingPolicy ? "not-allowed" : "pointer",
                  opacity: applyingPolicy ? 0.6 : 1,
                  transition: "all 0.15s ease",
                }}
              >
                {applyingPolicy === "SURGE_PROTECTION" ? "Applying..." : "Apply Mode"}
              </button>
            </div>
          </div>

          {/* 3. CRITICAL EMERGENCY SHIELD */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 14,
              border:
                defenseSystem.recommendedDefensePolicy === "CRITICAL_SHIELD"
                  ? "2px solid #ef4444"
                  : "1px solid #e2e8f0",
              padding: isMobile ? "12px 14px" : "16px 18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "2px 7px",
                    borderRadius: 6,
                    background: "#fef2f2",
                    color: "#b91c1c",
                    border: "1px solid #fecaca",
                  }}
                >
                  High Risk (&gt;90%)
                </span>
                <ShieldAlert size={16} color="#ef4444" />
              </div>

              <h4
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: "4px 0 4px 0",
                }}
              >
                Critical Emergency Shield
              </h4>
              <p
                style={{
                  fontSize: 11.5,
                  color: "#64748b",
                  margin: 0,
                  lineHeight: 1.45,
                }}
              >
                Tight virtual queue at 50 active students. Throttles heavy endpoints to guarantee zero Vercel 429 quota exhaustion.
              </p>
            </div>

            <div
              style={{
                marginTop: 14,
                paddingTop: 10,
                borderTop: "1px solid #f1f5f9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: 10.5, color: "#94a3b8" }}>Zero 429 Lockout</span>
              <button
                onClick={() => handleApplyPolicy("CRITICAL_SHIELD")}
                disabled={applyingPolicy !== null}
                style={{
                  padding: "6px 12px",
                  background: "#ef4444",
                  color: "#ffffff",
                  borderRadius: 8,
                  fontSize: 11.5,
                  fontWeight: 700,
                  border: "none",
                  cursor: applyingPolicy ? "not-allowed" : "pointer",
                  opacity: applyingPolicy ? 0.6 : 1,
                  transition: "all 0.15s ease",
                }}
              >
                {applyingPolicy === "CRITICAL_SHIELD" ? "Applying..." : "Apply Mode"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. ROUTE-BY-ROUTE CONSUMPTION BREAKDOWN ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: isMobile ? 14 : 18,
          padding: isMobile ? "14px 14px" : "20px 22px",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Layers size={18} color="#0f172a" />
              <h3
                style={{
                  fontSize: isMobile ? 15 : 16,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                Route-by-Route Request & Bandwidth Breakdown
              </h3>
            </div>
            <p
              style={{
                fontSize: isMobile ? 11 : 12,
                color: "#64748b",
                margin: "4px 0 0 0",
              }}
            >
              Ranked by serverless invocations and bandwidth consumed on Vercel.
            </p>
          </div>

          <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
            {(routeBreakdown || []).length} Routes
          </span>
        </div>

        {/* Mobile Fluid Cards or Desktop Table */}
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
            {(routeBreakdown || []).map((routeItem, idx) => (
              <div
                key={idx}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "12px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 6,
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 800,
                        color: "#0f172a",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {routeItem.pageTitle}
                    </div>
                    <code
                      style={{
                        fontSize: 11,
                        color: "#7c3aed",
                        background: "#f5f3ff",
                        padding: "1px 5px",
                        borderRadius: 4,
                        fontFamily: "monospace",
                        marginTop: 2,
                        display: "inline-block",
                      }}
                    >
                      {routeItem.route}
                    </code>
                  </div>

                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: 10,
                      whiteSpace: "nowrap",
                      background:
                        routeItem.priorityTier === "HIGH_CONSUMPTION"
                          ? "#fef2f2"
                          : routeItem.priorityTier === "MEDIUM_CONSUMPTION"
                          ? "#eef2ff"
                          : "#f1f5f9",
                      color:
                        routeItem.priorityTier === "HIGH_CONSUMPTION"
                          ? "#dc2626"
                          : routeItem.priorityTier === "MEDIUM_CONSUMPTION"
                          ? "#4f46e5"
                          : "#475569",
                      border:
                        routeItem.priorityTier === "HIGH_CONSUMPTION"
                          ? "1px solid #fecaca"
                          : routeItem.priorityTier === "MEDIUM_CONSUMPTION"
                          ? "1px solid #c7d2fe"
                          : "1px solid #cbd5e1",
                    }}
                  >
                    {routeItem.priorityTier.replace("_", " ")}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    paddingTop: 8,
                    borderTop: "1px solid #e2e8f0",
                    fontSize: 11.5,
                  }}
                >
                  <div>
                    <span style={{ fontSize: 10, color: "#94a3b8", display: "block" }}>
                      Estimated Invocations
                    </span>
                    <strong style={{ color: "#0f172a" }}>
                      {routeItem.estimatedInvocations.toLocaleString()} ({routeItem.percentOfTotal}%)
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 10, color: "#94a3b8", display: "block" }}>
                      Bandwidth Consumed
                    </span>
                    <strong style={{ color: "#0f172a" }}>
                      {routeItem.bandwidthMB} MB
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    paddingTop: 6,
                    borderTop: "1px solid #f1f5f9",
                    fontSize: 10.5,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span style={{ color: "#94a3b8" }}>Cache:</span>
                  <span
                    style={{
                      color: "#475569",
                      fontWeight: 600,
                      fontFamily: "monospace",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {routeItem.cacheRecommendation}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
              marginTop: 10,
              borderRadius: 12,
              border: "1px solid #e2e8f0",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: 12,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f8fafc",
                    color: "#475569",
                    borderBottom: "1px solid #e2e8f0",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  <th style={{ padding: "10px 14px" }}>Route / Page</th>
                  <th style={{ padding: "10px 14px" }}>Serverless Reqs</th>
                  <th style={{ padding: "10px 14px" }}>Traffic Share</th>
                  <th style={{ padding: "10px 14px" }}>Bandwidth (MB)</th>
                  <th style={{ padding: "10px 14px" }}>Tier</th>
                  <th style={{ padding: "10px 14px" }}>Recommended Caching</th>
                </tr>
              </thead>
              <tbody>
                {(routeBreakdown || []).map((routeItem, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background 0.1s ease",
                    }}
                  >
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>
                        {routeItem.pageTitle}
                      </div>
                      <code
                        style={{
                          fontSize: 11,
                          color: "#7c3aed",
                          background: "#f5f3ff",
                          padding: "1px 5px",
                          borderRadius: 4,
                          fontFamily: "monospace",
                        }}
                      >
                        {routeItem.route}
                      </code>
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: 800, color: "#0f172a" }}>
                      {routeItem.estimatedInvocations.toLocaleString()}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700, color: "#334155", minWidth: 36 }}>
                          {routeItem.percentOfTotal}%
                        </span>
                        <div
                          style={{
                            width: 60,
                            height: 5,
                            borderRadius: 3,
                            background: "#f1f5f9",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(100, Math.max(2, routeItem.percentOfTotal))}%`,
                              height: "100%",
                              background: "#7c3aed",
                              borderRadius: 3,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#334155" }}>
                      {routeItem.bandwidthMB} MB
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "2px 7px",
                          borderRadius: 10,
                          whiteSpace: "nowrap",
                          background:
                            routeItem.priorityTier === "HIGH_CONSUMPTION"
                              ? "#fef2f2"
                              : routeItem.priorityTier === "MEDIUM_CONSUMPTION"
                              ? "#eef2ff"
                              : "#f1f5f9",
                          color:
                            routeItem.priorityTier === "HIGH_CONSUMPTION"
                              ? "#dc2626"
                              : routeItem.priorityTier === "MEDIUM_CONSUMPTION"
                              ? "#4f46e5"
                              : "#475569",
                          border:
                            routeItem.priorityTier === "HIGH_CONSUMPTION"
                              ? "1px solid #fecaca"
                              : routeItem.priorityTier === "MEDIUM_CONSUMPTION"
                              ? "1px solid #c7d2fe"
                              : "1px solid #cbd5e1",
                        }}
                      >
                        {routeItem.priorityTier.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", color: "#64748b", fontFamily: "monospace", fontSize: 11 }}>
                      {routeItem.cacheRecommendation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
