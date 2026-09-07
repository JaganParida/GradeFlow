import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  Zap,
  Clock,
  Calendar,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  TrendingUp,
  Layers,
  ChevronLeft,
  ChevronRight,
  Users,
  Globe,
  Sparkles,
  Search,
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

  // Route breakdown filters & pagination
  const [routeCategory, setRouteCategory] = useState("ALL"); // ALL | STUDENT | ADMIN | PUBLIC | HIGH
  const [routeSearch, setRouteSearch] = useState("");
  const [routePage, setRoutePage] = useState(1);
  const ROUTES_PER_PAGE = isMobile ? 5 : 6;

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

  const allRoutes = data?.routeBreakdown || [];

  const filteredRoutes = useMemo(() => {
    return allRoutes.filter((r) => {
      if (routeCategory === "STUDENT" && r.category !== "STUDENT") return false;
      if (routeCategory === "ADMIN" && r.category !== "ADMIN") return false;
      if (routeCategory === "PUBLIC" && r.category !== "PUBLIC") return false;
      if (routeCategory === "HIGH" && r.priorityTier !== "HIGH_CONSUMPTION") return false;

      if (routeSearch.trim()) {
        const query = routeSearch.toLowerCase();
        const matchesTitle = (r.pageTitle || "").toLowerCase().includes(query);
        const matchesRoute = (r.route || "").toLowerCase().includes(query);
        if (!matchesTitle && !matchesRoute) return false;
      }

      return true;
    });
  }, [allRoutes, routeCategory, routeSearch]);

  const totalRoutePages = Math.max(1, Math.ceil(filteredRoutes.length / ROUTES_PER_PAGE));
  const paginatedRoutes = useMemo(() => {
    const start = (routePage - 1) * ROUTES_PER_PAGE;
    return filteredRoutes.slice(start, start + ROUTES_PER_PAGE);
  }, [filteredRoutes, routePage, ROUTES_PER_PAGE]);

  useEffect(() => {
    setRoutePage(1);
  }, [routeCategory, routeSearch]);

  const counts = useMemo(() => {
    return {
      ALL: allRoutes.length,
      STUDENT: allRoutes.filter((r) => r.category === "STUDENT").length,
      ADMIN: allRoutes.filter((r) => r.category === "ADMIN").length,
      PUBLIC: allRoutes.filter((r) => r.category === "PUBLIC").length,
      HIGH: allRoutes.filter((r) => r.priorityTier === "HIGH_CONSUMPTION").length,
    };
  }, [allRoutes]);

  if (loading) {
    return (
      <div
        style={{
          background: "#ffffff",
          borderRadius: 14,
          border: "1px solid #e2e8f0",
          padding: isMobile ? "30px 14px" : "44px 20px",
          textAlign: "center",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "#eff6ff",
            color: "#2563eb",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          <RefreshCw size={20} className="spin" />
        </div>
        <h3
          style={{
            fontSize: isMobile ? 14.5 : 16,
            fontWeight: 800,
            color: "#0f172a",
            margin: "0 0 4px 0",
          }}
        >
          Calculating Vercel Quota Telemetry...
        </h3>
        <p
          style={{
            fontSize: isMobile ? 11 : 12.5,
            color: "#64748b",
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          Querying on-demand serverless requests, bandwidth, and peak hours.
        </p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div
        style={{
          background: "#ffffff",
          borderRadius: 14,
          border: "1px solid #fecaca",
          padding: isMobile ? "24px 14px" : "36px 20px",
          textAlign: "center",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "#fef2f2",
            color: "#dc2626",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
          }}
        >
          <AlertTriangle size={20} />
        </div>
        <h3
          style={{
            fontSize: isMobile ? 14.5 : 16,
            fontWeight: 800,
            color: "#0f172a",
            margin: "0 0 4px 0",
          }}
        >
          Failed to Calculate Quota Intelligence
        </h3>
        <p
          style={{
            fontSize: isMobile ? 11 : 12.5,
            color: "#64748b",
            margin: "0 0 14px 0",
          }}
        >
          {error}
        </p>
        <button
          onClick={() => fetchQuotaMetrics(true)}
          style={{
            padding: "8px 14px",
            background: "#0f172a",
            color: "#ffffff",
            borderRadius: 8,
            fontSize: 11.5,
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <RefreshCw size={12} /> Retry Calculation
        </button>
      </div>
    );
  }

  const { today, month, bandwidth, peakTiming, defenseSystem, timestamp } = data;

  const maxHistogramRequests = Math.max(
    1,
    ...(peakTiming?.hourlyDistribution?.map((h) => h.requests) || [1])
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 12 : 18,
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      {/* ── 1. CLEAN LIGHT HEADER BANNER (NO DARK TYPE, 100% NON-OVERFLOWING) ── */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: isMobile ? 12 : 16,
          border: "1px solid #e2e8f0",
          padding: isMobile ? "12px" : "18px 22px",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "stretch" : "center",
            gap: isMobile ? 10 : 16,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                flexWrap: "wrap",
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Zap size={15} />
              </div>

              <h2
                style={{
                  fontSize: isMobile ? 15 : 18,
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: "-0.3px",
                  margin: 0,
                  wordBreak: "break-word",
                }}
              >
                Vercel Quota & Traffic Engine
              </h2>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 7px",
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 20,
                  background: "#ecfdf5",
                  color: "#059669",
                  border: "1px solid #a7f3d0",
                  whiteSpace: "nowrap",
                }}
              >
                <CheckCircle2 size={10} /> Zero-Drain
              </span>
            </div>

            <p
              style={{
                fontSize: isMobile ? 11 : 12.5,
                color: "#64748b",
                margin: 0,
                lineHeight: 1.45,
                wordBreak: "break-word",
              }}
            >
              Real-time on-demand calculations. Zero polling intervals. Every route including Admin and Students is tracked accurately.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isMobile ? "space-between" : "flex-end",
              gap: 8,
              borderTop: isMobile ? "1px solid #f1f5f9" : "none",
              paddingTop: isMobile ? 8 : 0,
              flexShrink: 0,
            }}
          >
            <div>
              <div style={{ fontSize: 9.5, color: "#94a3b8", fontWeight: 600 }}>Calculated:</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#334155" }}>
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
                gap: 5,
                padding: isMobile ? "7px 12px" : "8px 14px",
                background: "#f8fafc",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                color: "#0f172a",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: refreshing ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <RefreshCw
                size={12}
                style={{
                  animation: refreshing ? "spin 1s linear infinite" : "none",
                  color: "#2563eb",
                }}
              />
              <span>{refreshing ? "Syncing..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {policyMessage && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: 10,
              padding: "8px 10px",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: policyMessage.type === "success" ? "#ecfdf5" : "#fef2f2",
              border:
                policyMessage.type === "success"
                  ? "1px solid #a7f3d0"
                  : "1px solid #fecaca",
              color: policyMessage.type === "success" ? "#065f46" : "#991b1b",
              boxSizing: "border-box",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              {policyMessage.type === "success" ? (
                <CheckCircle2 size={13} color="#059669" style={{ flexShrink: 0 }} />
              ) : (
                <AlertTriangle size={13} color="#dc2626" style={{ flexShrink: 0 }} />
              )}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {policyMessage.text}
              </span>
            </div>
            <button
              onClick={() => setPolicyMessage(null)}
              style={{
                background: "transparent",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                fontSize: 12,
                padding: "0 4px",
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </motion.div>
        )}
      </div>

      {/* ── 2. TOP 4 KEY KPI CARDS (RESPONSIVE GRID, ZERO OVERFLOW) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "repeat(2, minmax(0, 1fr))"
            : "repeat(4, minmax(0, 1fr))",
          gap: isMobile ? 8 : 12,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* CARD 1: TODAY'S INVOCATIONS */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: isMobile ? 12 : 14,
            padding: isMobile ? "10px" : "14px 16px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 4,
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 800,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                Today
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  padding: "1px 5px",
                  borderRadius: 8,
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
                }}
              >
                {today.percent}%
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 4,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: isMobile ? 18 : 24,
                  fontWeight: 900,
                  color: "#0f172a",
                  lineHeight: 1,
                  letterSpacing: "-0.5px",
                }}
              >
                {today.used.toLocaleString()}
              </span>
              <span style={{ fontSize: 9.5, fontWeight: 600, color: "#94a3b8" }}>
                / {today.budget.toLocaleString()}
              </span>
            </div>

            <div
              style={{
                width: "100%",
                height: 4,
                borderRadius: 3,
                background: "#f1f5f9",
                marginTop: 8,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, Math.max(2, today.percent))}%`,
                  height: "100%",
                  background:
                    today.percent >= 90
                      ? "#ef4444"
                      : today.percent >= 70
                      ? "#f59e0b"
                      : "#10b981",
                }}
              />
            </div>
          </div>

          <div
            style={{
              fontSize: 9.5,
              color: "#64748b",
              marginTop: 8,
              paddingTop: 6,
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <span>Remaining:</span>
            <strong style={{ color: "#0f172a" }}>{today.remaining.toLocaleString()}</strong>
          </div>
        </div>

        {/* CARD 2: MONTHLY QUOTA */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: isMobile ? 12 : 14,
            padding: isMobile ? "10px" : "14px 16px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 4,
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 800,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                Month (100k)
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  padding: "1px 5px",
                  borderRadius: 8,
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
                }}
              >
                {month.percent}%
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 4,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: isMobile ? 18 : 24,
                  fontWeight: 900,
                  color: "#0f172a",
                  lineHeight: 1,
                  letterSpacing: "-0.5px",
                }}
              >
                {month.used.toLocaleString()}
              </span>
              <span style={{ fontSize: 9.5, fontWeight: 600, color: "#94a3b8" }}>
                / 100k
              </span>
            </div>

            <div
              style={{
                width: "100%",
                height: 4,
                borderRadius: 3,
                background: "#f1f5f9",
                marginTop: 8,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, Math.max(2, month.percent))}%`,
                  height: "100%",
                  background:
                    month.percent >= 90
                      ? "#ef4444"
                      : month.percent >= 70
                      ? "#f59e0b"
                      : "#7c3aed",
                }}
              />
            </div>
          </div>

          <div
            style={{
              fontSize: 9.5,
              color: "#64748b",
              marginTop: 8,
              paddingTop: 6,
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <span>Projected:</span>
            <strong style={{ color: "#0f172a" }}>~{month.projectedMonthEndRequests.toLocaleString()}</strong>
          </div>
        </div>

        {/* CARD 3: ORIGIN BANDWIDTH */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: isMobile ? 12 : 14,
            padding: isMobile ? "10px" : "14px 16px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 4,
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 800,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                Bandwidth
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  padding: "1px 5px",
                  borderRadius: 8,
                  whiteSpace: "nowrap",
                  background: "#ecfeff",
                  color: "#0891b2",
                }}
              >
                {bandwidth.percent}%
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 4,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: isMobile ? 18 : 24,
                  fontWeight: 900,
                  color: "#0f172a",
                  lineHeight: 1,
                  letterSpacing: "-0.5px",
                }}
              >
                {bandwidth.usedGB}
              </span>
              <span style={{ fontSize: 9.5, fontWeight: 600, color: "#94a3b8" }}>
                / 100 GB
              </span>
            </div>

            <div
              style={{
                width: "100%",
                height: 4,
                borderRadius: 3,
                background: "#f1f5f9",
                marginTop: 8,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, Math.max(2, bandwidth.percent))}%`,
                  height: "100%",
                  background: "#06b6d4",
                }}
              />
            </div>
          </div>

          <div
            style={{
              fontSize: 9.5,
              color: "#64748b",
              marginTop: 8,
              paddingTop: 6,
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <span>Free:</span>
            <strong style={{ color: "#0f172a" }}>{bandwidth.remainingGB} GB</strong>
          </div>
        </div>

        {/* CARD 4: DEFENSE ENGINE */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: isMobile ? 12 : 14,
            padding: isMobile ? "10px" : "14px 16px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxSizing: "border-box",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 4,
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 800,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                Defense
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  padding: "1px 5px",
                  borderRadius: 8,
                  whiteSpace: "nowrap",
                  background: defenseSystem.currentQueueEnabled ? "#fffbeb" : "#ecfdf5",
                  color: defenseSystem.currentQueueEnabled ? "#d97706" : "#059669",
                }}
              >
                {defenseSystem.currentQueueEnabled ? "Queue" : "Direct"}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                margin: "2px 0",
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background:
                    defenseSystem.recommendedDefensePolicy === "CRITICAL_SHIELD"
                      ? "#ef4444"
                      : defenseSystem.recommendedDefensePolicy === "SURGE_PROTECTION"
                      ? "#f59e0b"
                      : "#10b981",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: isMobile ? 12.5 : 14,
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

            <div
              style={{
                fontSize: 9.5,
                color: "#64748b",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Cap: {defenseSystem.maxActiveCapacity} active
            </div>
          </div>

          <div
            style={{
              fontSize: 9.5,
              color: "#64748b",
              marginTop: 8,
              paddingTop: 6,
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <span>Status:</span>
            <strong style={{ color: "#059669" }}>Protected</strong>
          </div>
        </div>
      </div>

      {/* ── 3. PEAK TIMING & SURGE INTELLIGENCE (RESPONSIVE HISTOGRAM) ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: isMobile ? 12 : 16,
          padding: isMobile ? "12px" : "18px 20px",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "stretch" : "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={16} color="#7c3aed" />
              <h3
                style={{
                  fontSize: isMobile ? 14 : 15.5,
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
                fontSize: isMobile ? 10.5 : 12,
                color: "#64748b",
                margin: "2px 0 0 0",
              }}
            >
              Calculated from 24-hour serverless telemetry.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : "auto auto",
              gap: 6,
              width: isMobile ? "100%" : "auto",
            }}
          >
            <div
              style={{
                padding: "5px 8px",
                background: "#f5f3ff",
                border: "1px solid #ddd6fe",
                borderRadius: 8,
                fontSize: 10.5,
                display: "flex",
                alignItems: "center",
                gap: 5,
                minWidth: 0,
              }}
            >
              <Clock size={12} color="#7c3aed" style={{ flexShrink: 0 }} />
              <span style={{ color: "#2e1065", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {peakTiming?.peakHourText || "8:00 PM – 9:00 PM"}
              </span>
            </div>

            <div
              style={{
                padding: "5px 8px",
                background: "#eef2ff",
                border: "1px solid #c7d2fe",
                borderRadius: 8,
                fontSize: 10.5,
                display: "flex",
                alignItems: "center",
                gap: 5,
                minWidth: 0,
              }}
            >
              <Calendar size={12} color="#4f46e5" style={{ flexShrink: 0 }} />
              <span style={{ color: "#1e1b4b", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {peakTiming?.peakDayText || "Tuesday"}
              </span>
            </div>
          </div>
        </div>

        {/* 24-Hour Bar Histogram with zero overflow */}
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: isMobile ? "10px 6px 6px 6px" : "14px 12px 8px 12px",
            boxSizing: "border-box",
            width: "100%",
          }}
        >
          <div
            style={{
              height: isMobile ? 90 : 120,
              display: "flex",
              alignItems: "flex-end",
              gap: isMobile ? 1.5 : 3,
              paddingBottom: 4,
              width: "100%",
              boxSizing: "border-box",
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
                    minWidth: 0,
                  }}
                  title={`${h.label}: ${h.requests} requests`}
                >
                  {isPeak && (
                    <Sparkles
                      size={9}
                      color="#d97706"
                      style={{ marginBottom: 1, flexShrink: 0 }}
                    />
                  )}

                  <div
                    style={{
                      width: "100%",
                      height: `${heightPercent}%`,
                      borderRadius: "3px 3px 0 0",
                      background: isPeak
                        ? "linear-gradient(180deg, #8b5cf6 0%, #6366f1 100%)"
                        : "#cbd5e1",
                    }}
                  />
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 9,
              fontWeight: 700,
              color: "#64748b",
              paddingTop: 4,
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <span>12 AM</span>
            <span>6 AM</span>
            <span>12 PM</span>
            <span style={{ color: "#7c3aed", fontWeight: 800 }}>Peak 8 PM</span>
            <span>11 PM</span>
          </div>
        </div>
      </div>

      {/* ── 4. AUTO-DEFENSE POLICIES (1-CLICK APPLY) ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: isMobile ? 12 : 16,
          padding: isMobile ? "12px" : "18px 20px",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            gap: 6,
            marginBottom: 12,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ShieldCheck size={17} color="#2563eb" />
              <h3
                style={{
                  fontSize: isMobile ? 14 : 15.5,
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
                fontSize: isMobile ? 10.5 : 12,
                color: "#64748b",
                margin: "2px 0 0 0",
              }}
            >
              Enterprise traffic pacing to guarantee zero Vercel 429 quota lockouts.
            </p>
          </div>

          <span
            style={{
              padding: "3px 8px",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
              fontSize: 10.5,
              fontWeight: 700,
              borderRadius: 20,
              whiteSpace: "nowrap",
            }}
          >
            Active: {defenseSystem.defenseBadge}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
            gap: isMobile ? 8 : 12,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* OPTIMAL */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 10,
              border:
                defenseSystem.recommendedDefensePolicy === "OPTIMAL"
                  ? "1.5px solid #10b981"
                  : "1px solid #e2e8f0",
              padding: isMobile ? "10px 12px" : "14px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxSizing: "border-box",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    padding: "1px 6px",
                    borderRadius: 5,
                    background: "#ecfdf5",
                    color: "#047857",
                    border: "1px solid #a7f3d0",
                  }}
                >
                  Normal (&lt;70%)
                </span>
                <CheckCircle2 size={14} color="#10b981" />
              </div>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", margin: "2px 0" }}>
                Optimal Speed Mode
              </h4>
              <p style={{ fontSize: 10.5, color: "#64748b", margin: 0, lineHeight: 1.4 }}>
                Direct serverless invocation. Queue off. Cap: 250 students.
              </p>
            </div>
            <button
              onClick={() => handleApplyPolicy("OPTIMAL")}
              disabled={applyingPolicy !== null}
              style={{
                marginTop: 10,
                width: "100%",
                padding: "6px",
                background: "#10b981",
                color: "#ffffff",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                border: "none",
                cursor: applyingPolicy ? "not-allowed" : "pointer",
              }}
            >
              {applyingPolicy === "OPTIMAL" ? "Applying..." : "Apply Mode"}
            </button>
          </div>

          {/* SURGE */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 10,
              border:
                defenseSystem.recommendedDefensePolicy === "SURGE_PROTECTION"
                  ? "1.5px solid #f59e0b"
                  : "1px solid #e2e8f0",
              padding: isMobile ? "10px 12px" : "14px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxSizing: "border-box",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    padding: "1px 6px",
                    borderRadius: 5,
                    background: "#fffbeb",
                    color: "#b45309",
                    border: "1px solid #fde68a",
                  }}
                >
                  Surge (70%-90%)
                </span>
                <TrendingUp size={14} color="#f59e0b" />
              </div>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", margin: "2px 0" }}>
                Surge Protection
              </h4>
              <p style={{ fontSize: 10.5, color: "#64748b", margin: 0, lineHeight: 1.4 }}>
                Enables queue at 150 students. Paces requests to protect budget.
              </p>
            </div>
            <button
              onClick={() => handleApplyPolicy("SURGE_PROTECTION")}
              disabled={applyingPolicy !== null}
              style={{
                marginTop: 10,
                width: "100%",
                padding: "6px",
                background: "#f59e0b",
                color: "#ffffff",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                border: "none",
                cursor: applyingPolicy ? "not-allowed" : "pointer",
              }}
            >
              {applyingPolicy === "SURGE_PROTECTION" ? "Applying..." : "Apply Mode"}
            </button>
          </div>

          {/* CRITICAL */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 10,
              border:
                defenseSystem.recommendedDefensePolicy === "CRITICAL_SHIELD"
                  ? "1.5px solid #ef4444"
                  : "1px solid #e2e8f0",
              padding: isMobile ? "10px 12px" : "14px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxSizing: "border-box",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    padding: "1px 6px",
                    borderRadius: 5,
                    background: "#fef2f2",
                    color: "#b91c1c",
                    border: "1px solid #fecaca",
                  }}
                >
                  High Risk (&gt;90%)
                </span>
                <ShieldAlert size={14} color="#ef4444" />
              </div>
              <h4 style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", margin: "2px 0" }}>
                Critical Emergency Shield
              </h4>
              <p style={{ fontSize: 10.5, color: "#64748b", margin: 0, lineHeight: 1.4 }}>
                Tight queue at 50 students. Guarantees 0 Vercel 429 lockouts.
              </p>
            </div>
            <button
              onClick={() => handleApplyPolicy("CRITICAL_SHIELD")}
              disabled={applyingPolicy !== null}
              style={{
                marginTop: 10,
                width: "100%",
                padding: "6px",
                background: "#ef4444",
                color: "#ffffff",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                border: "none",
                cursor: applyingPolicy ? "not-allowed" : "pointer",
              }}
            >
              {applyingPolicy === "CRITICAL_SHIELD" ? "Applying..." : "Apply Mode"}
            </button>
          </div>
        </div>
      </div>

      {/* ── 5. ROUTE BREAKDOWN (ZERO HORIZONTAL OVERFLOW, CATEGORY PILLS, PAGINATION) ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: isMobile ? 12 : 16,
          padding: isMobile ? "12px" : "18px 20px",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        {/* Title and Search */}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "stretch" : "center",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Layers size={16} color="#0f172a" />
              <h3
                style={{
                  fontSize: isMobile ? 14 : 15.5,
                  fontWeight: 800,
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                Route Breakdown & Caching Strategy
              </h3>
            </div>
            <p
              style={{
                fontSize: isMobile ? 10.5 : 12,
                color: "#64748b",
                margin: "2px 0 0 0",
              }}
            >
              Real serverless invocations and bandwidth per route.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "5px 8px",
              boxSizing: "border-box",
              width: isMobile ? "100%" : 220,
            }}
          >
            <Search size={13} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search routes..."
              value={routeSearch}
              onChange={(e) => setRouteSearch(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: 11.5,
                color: "#0f172a",
                width: "100%",
              }}
            />
            {routeSearch && (
              <button
                onClick={() => setRouteSearch("")}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#94a3b8",
                  cursor: "pointer",
                  fontSize: 11,
                  padding: 0,
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ── WRAPPING CATEGORY PILLS (ZERO SCROLLBAR, FITS NATURALLY) ── */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 5,
            width: "100%",
            boxSizing: "border-box",
            marginBottom: 12,
            paddingBottom: 8,
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          {[
            { id: "ALL", label: "All", icon: <Layers size={11} />, count: counts.ALL },
            { id: "STUDENT", label: "Student", icon: <Users size={11} />, count: counts.STUDENT },
            { id: "ADMIN", label: "Admin", icon: <ShieldAlert size={11} />, count: counts.ADMIN },
            { id: "PUBLIC", label: "Public", icon: <Globe size={11} />, count: counts.PUBLIC },
            { id: "HIGH", label: "High Traffic", icon: <TrendingUp size={11} />, count: counts.HIGH },
          ].map((cat) => {
            const isActive = routeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setRouteCategory(cat.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: isMobile ? "5px 8px" : "6px 10px",
                  borderRadius: 8,
                  fontSize: isMobile ? 10.5 : 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: isActive ? "1px solid #4f46e5" : "1px solid #e2e8f0",
                  background: isActive ? "#4f46e5" : "#f8fafc",
                  color: isActive ? "#ffffff" : "#475569",
                  transition: "all 0.12s ease",
                  flex: isMobile ? "1 1 auto" : "none",
                  justifyContent: "center",
                }}
              >
                {cat.icon}
                <span>{cat.label}</span>
                <span
                  style={{
                    padding: "1px 4px",
                    borderRadius: 6,
                    fontSize: 9.5,
                    fontWeight: 800,
                    background: isActive ? "rgba(255, 255, 255, 0.25)" : "#e2e8f0",
                    color: isActive ? "#ffffff" : "#64748b",
                  }}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── ROUTE ITEMS: MOBILE CARDS OR DESKTOP TABLE ── */}
        {filteredRoutes.length === 0 ? (
          <div
            style={{
              padding: "24px 12px",
              textAlign: "center",
              color: "#94a3b8",
              fontSize: 11.5,
              background: "#f8fafc",
              borderRadius: 8,
            }}
          >
            No routes matching your criteria.
          </div>
        ) : isMobile ? (
          /* MOBILE FLUID CARDS (100% NON-SCROLLABLE, ZERO OVERFLOW) */
          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
            {paginatedRoutes.map((routeItem, idx) => (
              <div
                key={idx}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  boxSizing: "border-box",
                  width: "100%",
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
                        fontSize: 12,
                        fontWeight: 800,
                        color: "#0f172a",
                        wordBreak: "break-word",
                      }}
                    >
                      {routeItem.pageTitle}
                    </div>
                    <code
                      style={{
                        fontSize: 10.5,
                        color: "#4f46e5",
                        background: "#eef2ff",
                        padding: "1px 4px",
                        borderRadius: 3,
                        fontFamily: "monospace",
                        marginTop: 2,
                        display: "inline-block",
                        wordBreak: "break-all",
                      }}
                    >
                      {routeItem.route}
                    </code>
                  </div>

                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      padding: "2px 5px",
                      borderRadius: 6,
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
                      flexShrink: 0,
                    }}
                  >
                    {routeItem.priorityTier.replace("_", " ")}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 6,
                    paddingTop: 6,
                    borderTop: "1px solid #f8fafc",
                    fontSize: 10.5,
                  }}
                >
                  <div>
                    <span style={{ fontSize: 9, color: "#94a3b8", display: "block" }}>
                      Serverless Reqs
                    </span>
                    <strong style={{ color: "#0f172a" }}>
                      {routeItem.estimatedInvocations.toLocaleString()} ({routeItem.percentOfTotal}%)
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: 9, color: "#94a3b8", display: "block" }}>
                      Bandwidth
                    </span>
                    <strong style={{ color: "#0f172a" }}>
                      {routeItem.bandwidthMB} MB
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    paddingTop: 4,
                    borderTop: "1px solid #f8fafc",
                    fontSize: 9.5,
                  }}
                >
                  <span style={{ color: "#94a3b8" }}>Cache: </span>
                  <span
                    style={{
                      color: "#475569",
                      fontWeight: 600,
                      fontFamily: "monospace",
                      wordBreak: "break-word",
                    }}
                  >
                    {routeItem.cacheRecommendation}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* DESKTOP TABLE */
          <div
            style={{
              overflowX: "auto",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              width: "100%",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: 11.5,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f8fafc",
                    color: "#475569",
                    borderBottom: "1px solid #e2e8f0",
                    fontSize: 10.5,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  <th style={{ padding: "9px 12px" }}>Route / Page</th>
                  <th style={{ padding: "9px 12px" }}>Category</th>
                  <th style={{ padding: "9px 12px" }}>Serverless Reqs</th>
                  <th style={{ padding: "9px 12px" }}>Traffic Share</th>
                  <th style={{ padding: "9px 12px" }}>Bandwidth (MB)</th>
                  <th style={{ padding: "9px 12px" }}>Tier</th>
                  <th style={{ padding: "9px 12px" }}>Recommended Caching</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRoutes.map((routeItem, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background 0.1s ease",
                    }}
                  >
                    <td style={{ padding: "9px 12px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>
                        {routeItem.pageTitle}
                      </div>
                      <code
                        style={{
                          fontSize: 10.5,
                          color: "#4f46e5",
                          background: "#eef2ff",
                          padding: "1px 4px",
                          borderRadius: 3,
                          fontFamily: "monospace",
                        }}
                      >
                        {routeItem.route}
                      </code>
                    </td>
                    <td style={{ padding: "9px 12px" }}>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          padding: "2px 5px",
                          borderRadius: 5,
                          background:
                            routeItem.category === "ADMIN"
                              ? "#fef2f2"
                              : routeItem.category === "STUDENT"
                              ? "#ecfdf5"
                              : "#f8fafc",
                          color:
                            routeItem.category === "ADMIN"
                              ? "#b91c1c"
                              : routeItem.category === "STUDENT"
                              ? "#047857"
                              : "#475569",
                          border: "1px solid rgba(0,0,0,0.06)",
                        }}
                      >
                        {routeItem.category}
                      </span>
                    </td>
                    <td style={{ padding: "9px 12px", fontWeight: 800, color: "#0f172a" }}>
                      {routeItem.estimatedInvocations.toLocaleString()}
                    </td>
                    <td style={{ padding: "9px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontWeight: 700, color: "#334155", minWidth: 38 }}>
                          {routeItem.percentOfTotal}%
                        </span>
                        <div
                          style={{
                            width: 50,
                            height: 4,
                            borderRadius: 2,
                            background: "#f1f5f9",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(100, Math.max(2, routeItem.percentOfTotal))}%`,
                              height: "100%",
                              background: "#6366f1",
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "9px 12px", fontWeight: 600, color: "#334155" }}>
                      {routeItem.bandwidthMB} MB
                    </td>
                    <td style={{ padding: "9px 12px" }}>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: 8,
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
                    <td style={{ padding: "9px 12px", color: "#64748b", fontFamily: "monospace", fontSize: 10.5 }}>
                      {routeItem.cacheRecommendation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── PAGINATION CONTROLS (RESPONSIVE, ZERO OVERFLOW) ── */}
        <div
          style={{
            marginTop: 12,
            paddingTop: 8,
            borderTop: "1px solid #f1f5f9",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
            Showing{" "}
            <strong style={{ color: "#0f172a" }}>
              {filteredRoutes.length === 0 ? 0 : (routePage - 1) * ROUTES_PER_PAGE + 1}
            </strong>{" "}
            to{" "}
            <strong style={{ color: "#0f172a" }}>
              {Math.min(routePage * ROUTES_PER_PAGE, filteredRoutes.length)}
            </strong>{" "}
            of <strong style={{ color: "#0f172a" }}>{filteredRoutes.length}</strong>
          </span>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              width: isMobile ? "100%" : "auto",
              justifyContent: isMobile ? "space-between" : "flex-end",
            }}
          >
            <button
              onClick={() => setRoutePage((p) => Math.max(1, p - 1))}
              disabled={routePage <= 1}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "5px 10px",
                borderRadius: 7,
                border: "1px solid #cbd5e1",
                background: routePage <= 1 ? "#f8fafc" : "#ffffff",
                color: routePage <= 1 ? "#94a3b8" : "#0f172a",
                fontSize: 11,
                fontWeight: 700,
                cursor: routePage <= 1 ? "not-allowed" : "pointer",
              }}
            >
              <ChevronLeft size={13} /> Prev
            </button>

            {/* In mobile, compact page indicator; in desktop, numbered buttons */}
            {isMobile ? (
              <span style={{ fontSize: 11, fontWeight: 700, color: "#334155" }}>
                Page {routePage} / {totalRoutePages}
              </span>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                {Array.from({ length: totalRoutePages }).map((_, i) => {
                  const pNum = i + 1;
                  const isCur = routePage === pNum;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setRoutePage(pNum)}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                        border: isCur ? "1px solid #4f46e5" : "1px solid #e2e8f0",
                        background: isCur ? "#4f46e5" : "#ffffff",
                        color: isCur ? "#ffffff" : "#475569",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setRoutePage((p) => Math.min(totalRoutePages, p + 1))}
              disabled={routePage >= totalRoutePages}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "5px 10px",
                borderRadius: 7,
                border: "1px solid #cbd5e1",
                background: routePage >= totalRoutePages ? "#f8fafc" : "#ffffff",
                color: routePage >= totalRoutePages ? "#94a3b8" : "#0f172a",
                fontSize: 11,
                fontWeight: 700,
                cursor: routePage >= totalRoutePages ? "not-allowed" : "pointer",
              }}
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
