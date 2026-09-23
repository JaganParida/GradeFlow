import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { getAdminCache, setAdminCache, invalidateAdminCache, onAdminCacheDirty, AdminCacheScopes } from "../utils/adminRealtimeCache";
import { AdminVercelQuotaSkeleton } from "./LoadingSpinner";
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
  Flame,
  Check,
  Star,
  Circle,
  Search,
  Activity,
  BarChart3,
  Info,
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

  // Route breakdown filters & pagination
  const [routeCategory, setRouteCategory] = useState("ALL"); // ALL | STUDENT | ADMIN | PUBLIC | HIGH
  const [routeSearch, setRouteSearch] = useState("");
  const [routePage, setRoutePage] = useState(1);
  const ROUTES_PER_PAGE = isMobile ? 5 : 6;

  // Fetch Vercel Quota metrics strictly ON-DEMAND with permanent session cache
  const fetchQuotaMetrics = async (isManualRefresh = false) => {
    if (!isManualRefresh) {
      const cached = getAdminCache("gf_admin_vercel_quota_cache");
      if (cached && cached.today && cached.month && typeof cached.today.used === "number") {
        setData(cached);
        setLoading(false);
        return;
      }
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const actualHeaders = authHeaders?.headers || authHeaders || {};
      const res = await axios.get(`${API}/admin/vercel-quota`, {
        headers: {
          ...actualHeaders,
          "X-Requested-With": "XMLHttpRequest",
        },
        withCredentials: true,
      });

      if (res.data?.success) {
        setData(res.data);
        setAdminCache("gf_admin_vercel_quota_cache", res.data, AdminCacheScopes.TRAFFIC);
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

  // Real-time reactive invalidation listener for quota metrics
  useEffect(() => {
    return onAdminCacheDirty(AdminCacheScopes.TRAFFIC, () => {
      fetchQuotaMetrics(true);
    });
  }, []);

  const handleApplyPolicy = async (policyName) => {
    setApplyingPolicy(policyName);
    setPolicyMessage(null);
    try {
      const actualHeaders = authHeaders?.headers || authHeaders || {};
      const res = await axios.post(
        `${API}/admin/vercel-quota/apply-policy`,
        { policy: policyName },
        {
          headers: {
            ...actualHeaders,
            "X-Requested-With": "XMLHttpRequest",
          },
          withCredentials: true,
        }
      );
      if (res.data?.success) {
        setPolicyMessage({
          type: "success",
          text: `Applied ${policyName.replace("_", " ")} defense policy successfully!`,
        });
        // Invalidate cached traffic and quota metrics across admin dashboard
        invalidateAdminCache(AdminCacheScopes.TRAFFIC);
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
    return <AdminVercelQuotaSkeleton isMobile={isMobile} />;
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

  const today = data?.today || { used: 0, budget: 33333, remaining: 33333, percent: 0, status: "NORMAL" };
  const month = data?.month || { used: 0, limit: 1000000, remaining: 1000000, percent: 0, dailyBurnRate: 0, projectedMonthEndRequests: 0, projectedMonthPercent: 0, projectionStatus: "HEALTHY" };
  const bandwidth = data?.bandwidth || { usedGB: 0, limitGB: 100, remainingGB: 100, percent: 0 };
  const peakTiming = data?.peakTiming || { peakHourText: "8:00 PM", peakDayText: "Today", totalActiveStudents: 0, hourlyDistribution: [] };
  const defenseSystem = data?.defenseSystem || {
    currentQueueEnabled: false,
    autoTriggerEnabled: true,
    maxActiveCapacity: 250,
    activePolicy: "OPTIMAL",
    activeBadge: "Optimal Speed Mode",
    activeColor: "#10b981",
    recommendedDefensePolicy: "OPTIMAL",
    recommendedBadge: "Optimal Speed Mode",
    recommendedDescription: "Direct serverless execution. Caching active. Normal operation.",
    statusAlignment: "ALIGNED",
    defenseBadge: "Optimal Speed Mode",
    defenseDescription: "Direct serverless execution.",
  };
  const timestamp = data?.timestamp || "";

  const maxHistogramRequests = Math.max(
    1,
    ...(peakTiming?.hourlyDistribution?.map((h) => h.requests) || [1])
  );

  const now = new Date();
  const currentIstHour = new Date(now.getTime() + 5.5 * 60 * 60 * 1000).getUTCHours();

  const activeHoursCount = (peakTiming?.hourlyDistribution || []).filter(
    (h) => (h.requests || 0) > 0
  ).length;

  const top3HoursShare = (() => {
    const sorted = [...(peakTiming?.hourlyDistribution || [])].sort(
      (a, b) => (b.requests || 0) - (a.requests || 0)
    );
    const top3Sum =
      (sorted[0]?.requests || 0) +
      (sorted[1]?.requests || 0) +
      (sorted[2]?.requests || 0);
    const totalToday = today?.used || 0;
    if (totalToday <= 0 || top3Sum <= 0) return 0;
    return Math.min(100, Math.round((top3Sum / totalToday) * 100));
  })();

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
              <X size={13} />
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
                Month (1M Quota)
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
                / 1M
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
            <span>Month Projection:</span>
            <strong style={{ color: "#0f172a" }}>Est. {month.projectedMonthEndRequests.toLocaleString()} / mo</strong>
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
                {defenseSystem.currentQueueEnabled ? "Queue Active" : "Direct Mode"}
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
                    defenseSystem.activeColor ||
                    (defenseSystem.currentQueueEnabled ? "#f59e0b" : "#10b981"),
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
                {defenseSystem.activeBadge || (defenseSystem.currentQueueEnabled ? "Traffic Queue" : "Optimal Speed Mode")}
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
              {defenseSystem.currentQueueEnabled
                ? `Queue Cap: ${defenseSystem.maxActiveCapacity} active`
                : `Direct Serverless (Cap ${defenseSystem.maxActiveCapacity})`}
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
            <span>Protection:</span>
            <strong
              style={{
                color:
                  defenseSystem.statusAlignment === "ALIGNED"
                    ? "#059669"
                    : defenseSystem.statusAlignment === "OVER_PROTECTED"
                    ? "#2563eb"
                    : "#d97706",
              }}
            >
              {defenseSystem.statusAlignment === "ALIGNED"
                ? "Optimal"
                : defenseSystem.statusAlignment === "OVER_PROTECTED"
                ? "Max Shield"
                : "Elevated"}
            </strong>
          </div>
        </div>
      </div>

      {/* ── 3. PEAK TIMING & SURGE INTELLIGENCE (RESPONSIVE HISTOGRAM) ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: isMobile ? 14 : 18,
          padding: isMobile ? "14px 12px" : "20px 22px",
          boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02)",
          boxSizing: "border-box",
          width: "100%",
        }}
      >
        {/* Card Header & Badges */}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: isMobile ? 36 : 40,
                height: isMobile ? 36 : 40,
                borderRadius: 10,
                background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
                border: "1px solid #ddd6fe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 2px 6px rgba(124, 58, 237, 0.1)",
              }}
            >
              <TrendingUp size={isMobile ? 18 : 20} color="#7c3aed" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <h3
                  style={{
                    fontSize: isMobile ? 14.5 : 16,
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: 0,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Peak Timing & Surge Intelligence
                </h3>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 12,
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  24-Hour Telemetry
                </span>
              </div>
              <p
                style={{
                  fontSize: isMobile ? 11 : 12,
                  color: "#64748b",
                  margin: "2px 0 0 0",
                  fontWeight: 500,
                }}
              >
                Strict 24-hour serverless telemetry recorded for today ({peakTiming?.todayDateText || "Today"})
              </p>
            </div>
          </div>

          {/* Metric Badges */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              width: isMobile ? "100%" : "auto",
            }}
          >
            <div
              style={{
                padding: "6px 10px",
                background: "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
                border: "1px solid #d8b4fe",
                borderRadius: 8,
                fontSize: 11,
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "#581c87",
                fontWeight: 700,
                flex: isMobile ? "1 1 calc(50% - 6px)" : "initial",
                justifyContent: isMobile ? "center" : "flex-start",
              }}
            >
              <Zap size={12} color="#7c3aed" style={{ flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {peakTiming?.peakHourText ? `Peak: ${peakTiming.peakHourText}` : "Awaiting Peak"}
              </span>
              {peakTiming?.peakHourCount > 0 && (
                <span
                  style={{
                    background: "#7c3aed",
                    color: "#ffffff",
                    borderRadius: 4,
                    padding: "1px 5px",
                    fontSize: 9.5,
                    fontWeight: 800,
                  }}
                >
                  {peakTiming.peakHourCount} reqs
                </span>
              )}
            </div>

            <div
              style={{
                padding: "6px 10px",
                background: "#eef2ff",
                border: "1px solid #c7d2fe",
                borderRadius: 8,
                fontSize: 11,
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "#312e81",
                fontWeight: 700,
                flex: isMobile ? "1 1 calc(50% - 6px)" : "initial",
                justifyContent: isMobile ? "center" : "flex-start",
              }}
            >
              <Calendar size={12} color="#4f46e5" style={{ flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {peakTiming?.todayDateText ? `Date: ${peakTiming.todayDateText}` : (peakTiming?.peakDayText ? `Date: ${peakTiming.peakDayText}` : "Today: Active")}
              </span>
            </div>

            <div
              style={{
                padding: "6px 10px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 8,
                fontSize: 11,
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "#14532d",
                fontWeight: 700,
                flex: isMobile ? "1 1 100%" : "initial",
                justifyContent: isMobile ? "center" : "flex-start",
              }}
            >
              <Zap size={12} color="#16a34a" style={{ flexShrink: 0 }} />
              <span>
                <strong>{today?.used || 0}</strong> reqs tracked today
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Telemetry Inspector Strip (LOCKED 40px HEIGHT: ZERO LAYOUT SHIFT) */}
        <div
          style={{
            height: isMobile ? 42 : 38,
            minHeight: isMobile ? 42 : 38,
            maxHeight: isMobile ? 42 : 38,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: activeHistogramHour
              ? activeHistogramHour.hour === peakTiming.peakHourIndex
                ? "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)"
                : activeHistogramHour.requests > 0
                ? "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)"
                : "#f8fafc"
              : "#f8fafc",
            border: `1px solid ${
              activeHistogramHour
                ? activeHistogramHour.hour === peakTiming.peakHourIndex
                  ? "#d8b4fe"
                  : activeHistogramHour.requests > 0
                  ? "#bae6fd"
                  : "#e2e8f0"
                : "#e2e8f0"
            }`,
            borderRadius: 10,
            padding: "0 12px",
            marginBottom: 12,
            transition: "background 0.15s ease, border-color 0.15s ease",
            gap: 8,
            boxSizing: "border-box",
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          {activeHistogramHour ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, overflow: "hidden" }}>
                <Clock size={13} color="#7c3aed" style={{ flexShrink: 0 }} />
                <span style={{ fontWeight: 800, color: "#0f172a", fontSize: isMobile ? 11.5 : 12.5, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                  {activeHistogramHour.label} ({activeHistogramHour.hour === 0 ? "12:00 AM – 01:00 AM" : `${activeHistogramHour.hour % 12 || 12}:00 ${activeHistogramHour.hour >= 12 ? "PM" : "AM"} – ${(activeHistogramHour.hour + 1) % 12 || 12}:00 ${(activeHistogramHour.hour + 1) >= 12 ? "PM" : "AM"}`})
                </span>
                {activeHistogramHour.hour === peakTiming.peakHourIndex && activeHistogramHour.requests > 0 && (
                  <span
                    style={{
                      background: "#7c3aed",
                      color: "#ffffff",
                      padding: "1px 6px",
                      borderRadius: 4,
                      fontSize: 9.5,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <Zap size={10} color="#ffffff" />
                      <span>PEAK</span>
                    </span>
                  </span>
                )}
                {activeHistogramHour.hour === currentIstHour && (
                  <span
                    style={{
                      background: "#0284c7",
                      color: "#ffffff",
                      padding: "1px 6px",
                      borderRadius: 4,
                      fontSize: 9.5,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    NOW
                  </span>
                )}
                {activeHistogramHour.requests === 0 && (
                  <span
                    style={{
                      background: "#f1f5f9",
                      color: "#64748b",
                      border: "1px solid #cbd5e1",
                      padding: "1px 6px",
                      borderRadius: 4,
                      fontSize: 9.5,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    0 REQS
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, fontSize: isMobile ? 11 : 12.5 }}>
                <span style={{ color: "#334155", fontWeight: 700 }}>
                  <strong
                    style={{
                      color:
                        activeHistogramHour.requests > 0
                          ? activeHistogramHour.hour === peakTiming.peakHourIndex
                            ? "#7c3aed"
                            : "#0284c7"
                          : "#94a3b8",
                      fontSize: 13.5,
                      fontWeight: 800,
                    }}
                  >
                    {activeHistogramHour.requests}
                  </strong>{" "}
                  {activeHistogramHour.requests === 1 ? "req" : "reqs"}
                </span>
                {activeHistogramHour.percentage > 0 && (
                  <span style={{ color: "#64748b", fontWeight: 600, fontSize: 11 }}>
                    ({activeHistogramHour.percentage}%)
                  </span>
                )}
                <button
                  onClick={() => setActiveHistogramHour(null)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: "2px",
                    cursor: "pointer",
                    color: "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title="Deselect hour"
                >
                  <X size={13} />
                </button>
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: "#64748b",
                  fontSize: isMobile ? 11 : 12,
                }}
              >
                <Clock size={13} color="#7c3aed" style={{ flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {peakTiming?.peakHourIndex >= 0 && (peakTiming?.peakHourCount > 0 || (today?.used || 0) > 0)
                    ? `Today's Peak Surge: ${peakTiming.peakHourText} (${peakTiming.peakHourCount || 0} reqs)`
                    : "Hover on any hour bar to inspect serverless request telemetry"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, fontSize: isMobile ? 10.5 : 11.5 }}>
                <span style={{ color: "#94a3b8" }}>Hover to inspect</span>
                <span style={{ fontWeight: 700, color: "#1e293b", background: "#e2e8f0", padding: "1px 6px", borderRadius: 4 }}>
                  Today: {today?.used || 0} reqs
                </span>
              </div>
            </>
          )}
        </div>

        {/* 24-Hour Bar Histogram with Reference Grid */}
        <div
          style={{
            background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: isMobile ? "14px 8px 10px 8px" : "20px 18px 12px 18px",
            boxSizing: "border-box",
            width: "100%",
            position: "relative",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)",
          }}
        >
          {/* Subtle Grid Lines with Request Scale */}
          <div
            style={{
              position: "absolute",
              top: isMobile ? 14 : 20,
              left: isMobile ? 8 : 18,
              right: isMobile ? 8 : 18,
              height: isMobile ? 100 : 135,
              pointerEvents: "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              zIndex: 0,
            }}
          >
            <div
              style={{
                borderTop: "1px dashed #cbd5e1",
                width: "100%",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <span style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700, marginTop: -7, background: "#f8fafc", paddingLeft: 4, borderRadius: 2 }}>
                {maxHistogramRequests} reqs
              </span>
            </div>
            <div
              style={{
                borderTop: "1px dashed #e2e8f0",
                width: "100%",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <span style={{ fontSize: 9, color: "#94a3b8", fontWeight: 600, marginTop: -7, background: "#f8fafc", paddingLeft: 4, borderRadius: 2 }}>
                {Math.max(1, Math.round(maxHistogramRequests / 2))}
              </span>
            </div>
            <div style={{ borderTop: "1px solid #cbd5e1", width: "100%" }} />
          </div>

          {/* 24 Hourly Interactive Bars */}
          <div
            style={{
              height: isMobile ? 100 : 135,
              display: "flex",
              alignItems: "flex-end",
              gap: isMobile ? 2 : 4,
              paddingBottom: 2,
              width: "100%",
              boxSizing: "border-box",
              position: "relative",
              zIndex: 1,
            }}
          >
            {(peakTiming?.hourlyDistribution || []).map((h) => {
              const isPeak =
                peakTiming.peakHourIndex >= 0 &&
                h.hour === peakTiming.peakHourIndex &&
                h.requests > 0;
              const isHovered = activeHistogramHour?.hour === h.hour;
              const isCurrentHour = h.hour === currentIstHour;

              // Calculate proportional bar height (min 12% if requests > 0, 4% baseline if 0)
              const heightPercent =
                maxHistogramRequests > 0
                  ? h.requests > 0
                    ? Math.max(12, Math.round((h.requests / maxHistogramRequests) * 100))
                    : 4
                  : 4;

              // Colors based on state
              let barBg = "#e2e8f0";
              let barShadow = "none";

              if (isPeak) {
                barBg = isHovered
                  ? "linear-gradient(180deg, #9333ea 0%, #6b21a8 100%)"
                  : "linear-gradient(180deg, #a855f7 0%, #7c3aed 100%)";
                barShadow = "0 3px 12px rgba(124, 58, 237, 0.45)";
              } else if (h.requests > 0) {
                barBg = isHovered
                  ? "linear-gradient(180deg, #38bdf8 0%, #1d4ed8 100%)"
                  : "linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)";
                barShadow = isHovered ? "0 2px 8px rgba(37, 99, 235, 0.35)" : "none";
              } else if (isHovered) {
                barBg = "#cbd5e1";
              }

              return (
                <div
                  key={h.hour}
                  onMouseEnter={() => setActiveHistogramHour(h)}
                  onMouseLeave={() => setActiveHistogramHour(null)}
                  onClick={() =>
                    setActiveHistogramHour(
                      activeHistogramHour?.hour === h.hour ? null : h
                    )
                  }
                  style={{
                    flex: 1,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    cursor: "pointer",
                    minWidth: 0,
                    position: "relative",
                    touchAction: "manipulation",
                  }}
                >
                  {/* Floating Smooth Tooltip (Zero DOM Layout Shift, pointerEvents none) */}
                  {isHovered && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "calc(100% + 6px)",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "#0f172a",
                        color: "#ffffff",
                        padding: "3px 7px",
                        borderRadius: 6,
                        fontSize: 10.5,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                        boxShadow: "0 4px 14px rgba(15, 23, 42, 0.35)",
                        pointerEvents: "none",
                        zIndex: 40,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <span>{h.label}:</span>
                      <span style={{ color: isPeak ? "#c084fc" : "#38bdf8", fontWeight: 800 }}>
                        {h.requests} reqs
                      </span>
                      {h.percentage > 0 && (
                        <span style={{ color: "#94a3b8", fontSize: 9.5 }}>({h.percentage}%)</span>
                      )}
                    </div>
                  )}

                  {/* Peak Indicator Icon (Static flex-shrink 0, never causes layout jump) */}
                  {isPeak && (
                    <div style={{ marginBottom: 2, display: "flex", justifyContent: "center", flexShrink: 0 }}>
                      <Flame
                        size={isMobile ? 10 : 12}
                        color="#f59e0b"
                        style={{ flexShrink: 0, filter: "drop-shadow(0 1px 2px rgba(245, 158, 11, 0.6))" }}
                      />
                    </div>
                  )}

                  {/* The Stationary Bar Div */}
                  <div
                    style={{
                      width: "100%",
                      height: `${heightPercent}%`,
                      borderRadius: "4px 4px 1px 1px",
                      background: barBg,
                      boxShadow: barShadow,
                      border: isHovered
                        ? "1.5px solid #0f172a"
                        : isCurrentHour
                        ? "1.5px solid #0284c7"
                        : "none",
                      filter: isHovered ? "brightness(1.15)" : "none",
                      transition: "background 0.15s ease, filter 0.15s ease",
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Time Labels Along X-Axis (Responsive) */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: isMobile ? 8 : 10,
              fontWeight: 700,
              color: "#64748b",
              paddingTop: 6,
              borderTop: "1px solid #e2e8f0",
              marginTop: 4,
            }}
          >
            <span>12 AM</span>
            {!isMobile && <span>3 AM</span>}
            {isMobile ? <span>4 AM</span> : <span>6 AM</span>}
            {!isMobile && <span>9 AM</span>}
            {isMobile ? <span>8 AM</span> : null}
            <span>12 PM</span>
            {!isMobile && <span>3 PM</span>}
            {isMobile ? <span>4 PM</span> : <span>6 PM</span>}
            {!isMobile && <span>9 PM</span>}
            {isMobile ? <span>8 PM</span> : null}
            <span>11 PM</span>
          </div>
        </div>

        {/* ── Micro-Intelligence Telemetry Cards ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: 10,
            marginTop: 14,
          }}
        >
          <div
            style={{
              background: "#faf5ff",
              border: "1px solid #f3e8ff",
              borderRadius: 10,
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#f3e8ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Zap size={16} color="#7c3aed" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: "#6b21a8", fontWeight: 700 }}>
                Peak Surge Rate
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#3b0764" }}>
                {peakTiming?.peakHourCount || 0} req/hr
              </div>
              <div style={{ fontSize: 10, color: "#7e22ce", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Window: {peakTiming?.peakHourText || "Awaiting Traffic"}
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#f0f9ff",
              border: "1px solid #e0f2fe",
              borderRadius: 10,
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#e0f2fe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Activity size={16} color="#0284c7" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: "#0369a1", fontWeight: 700 }}>
                Daily Traffic Cadence
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0c4a6e" }}>
                {activeHoursCount} / 24 hrs active
              </div>
              <div style={{ fontSize: 10, color: "#0284c7", fontWeight: 500 }}>
                Serverless requests distributed
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #dcfce7",
              borderRadius: 10,
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#dcfce7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <BarChart3 size={16} color="#16a34a" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: "#15803d", fontWeight: 700 }}>
                Top 3 Hours Concentration
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#14532d" }}>
                {top3HoursShare}% of daily load
              </div>
              <div style={{ fontSize: 10, color: "#16a34a", fontWeight: 500 }}>
                Healthy serverless curve
              </div>
            </div>
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
            Active: {defenseSystem.activeBadge || (defenseSystem.currentQueueEnabled ? "Traffic Queue" : "Optimal Speed Mode")}
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
          {(() => {
            const isCurrentActive =
              (defenseSystem.activePolicy ||
                (defenseSystem.currentQueueEnabled ? "CUSTOM" : "OPTIMAL")) === "OPTIMAL";
            const isRecommended = defenseSystem.recommendedDefensePolicy === "OPTIMAL";
            return (
              <div
                style={{
                  background: isCurrentActive ? "#f0fdf4" : "#ffffff",
                  borderRadius: 10,
                  border: isCurrentActive
                    ? "2px solid #10b981"
                    : isRecommended
                    ? "1.5px dashed #10b981"
                    : "1px solid #e2e8f0",
                  padding: isMobile ? "10px 12px" : "14px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                  boxShadow: isCurrentActive
                    ? "0 2px 8px rgba(16, 185, 129, 0.12)"
                    : "none",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                      flexWrap: "wrap",
                      gap: 4,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
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
                      {isRecommended && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            padding: "1px 6px",
                            borderRadius: 4,
                            background: "#fef3c7",
                            color: "#b45309",
                            border: "1px solid #fde68a",
                          }}
                        >
                          ★ RECOMMENDED
                        </span>
                      )}
                    </div>
                    {isCurrentActive ? (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: "#10b981",
                          color: "#ffffff",
                        }}
                      >
                        ✓ ACTIVE
                      </span>
                    ) : (
                      <CheckCircle2 size={14} color="#10b981" />
                    )}
                  </div>
                  <h4
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#0f172a",
                      margin: "2px 0",
                    }}
                  >
                    Optimal Speed Mode
                  </h4>
                  <p
                    style={{
                      fontSize: 10.5,
                      color: "#64748b",
                      margin: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    Direct serverless invocation. Queue off. Cap: 250 students.
                  </p>
                </div>
                <button
                  onClick={() => !isCurrentActive && handleApplyPolicy("OPTIMAL")}
                  disabled={isCurrentActive || applyingPolicy !== null}
                  style={{
                    marginTop: 10,
                    width: "100%",
                    padding: "6px",
                    background: isCurrentActive ? "#e2e8f0" : "#10b981",
                    color: isCurrentActive ? "#475569" : "#ffffff",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    border: isCurrentActive ? "1px solid #cbd5e1" : "none",
                    cursor: isCurrentActive
                      ? "default"
                      : applyingPolicy
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {isCurrentActive
                    ? "✓ Currently Active"
                    : applyingPolicy === "OPTIMAL"
                    ? "Applying..."
                    : "Apply Mode"}
                </button>
              </div>
            );
          })()}

          {/* SURGE */}
          {(() => {
            const isCurrentActive = defenseSystem.activePolicy === "SURGE_PROTECTION";
            const isRecommended = defenseSystem.recommendedDefensePolicy === "SURGE_PROTECTION";
            return (
              <div
                style={{
                  background: isCurrentActive ? "#fffdf5" : "#ffffff",
                  borderRadius: 10,
                  border: isCurrentActive
                    ? "2px solid #f59e0b"
                    : isRecommended
                    ? "1.5px dashed #f59e0b"
                    : "1px solid #e2e8f0",
                  padding: isMobile ? "10px 12px" : "14px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                  boxShadow: isCurrentActive
                    ? "0 2px 8px rgba(245, 158, 11, 0.12)"
                    : "none",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                      flexWrap: "wrap",
                      gap: 4,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
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
                      {isRecommended && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            padding: "1px 6px",
                            borderRadius: 4,
                            background: "#fef3c7",
                            color: "#b45309",
                            border: "1px solid #fde68a",
                          }}
                        >
                          ★ RECOMMENDED
                        </span>
                      )}
                    </div>
                    {isCurrentActive ? (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: "#f59e0b",
                          color: "#ffffff",
                        }}
                      >
                        ✓ ACTIVE
                      </span>
                    ) : (
                      <TrendingUp size={14} color="#f59e0b" />
                    )}
                  </div>
                  <h4
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#0f172a",
                      margin: "2px 0",
                    }}
                  >
                    Surge Protection
                  </h4>
                  <p
                    style={{
                      fontSize: 10.5,
                      color: "#64748b",
                      margin: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    Enables queue at 150 students. Paces requests to protect budget.
                  </p>
                </div>
                <button
                  onClick={() => !isCurrentActive && handleApplyPolicy("SURGE_PROTECTION")}
                  disabled={isCurrentActive || applyingPolicy !== null}
                  style={{
                    marginTop: 10,
                    width: "100%",
                    padding: "6px",
                    background: isCurrentActive ? "#e2e8f0" : "#f59e0b",
                    color: isCurrentActive ? "#475569" : "#ffffff",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    border: isCurrentActive ? "1px solid #cbd5e1" : "none",
                    cursor: isCurrentActive
                      ? "default"
                      : applyingPolicy
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {isCurrentActive
                    ? "✓ Currently Active"
                    : applyingPolicy === "SURGE_PROTECTION"
                    ? "Applying..."
                    : "Apply Mode"}
                </button>
              </div>
            );
          })()}

          {/* CRITICAL */}
          {(() => {
            const isCurrentActive = defenseSystem.activePolicy === "CRITICAL_SHIELD";
            const isRecommended = defenseSystem.recommendedDefensePolicy === "CRITICAL_SHIELD";
            return (
              <div
                style={{
                  background: isCurrentActive ? "#fefcfc" : "#ffffff",
                  borderRadius: 10,
                  border: isCurrentActive
                    ? "2px solid #ef4444"
                    : isRecommended
                    ? "1.5px dashed #ef4444"
                    : "1px solid #e2e8f0",
                  padding: isMobile ? "10px 12px" : "14px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                  boxShadow: isCurrentActive
                    ? "0 2px 8px rgba(239, 68, 68, 0.12)"
                    : "none",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                      flexWrap: "wrap",
                      gap: 4,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
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
                      {isRecommended && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            padding: "1px 6px",
                            borderRadius: 4,
                            background: "#fef3c7",
                            color: "#b45309",
                            border: "1px solid #fde68a",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <Star size={9} fill="currentColor" />
                          <span>RECOMMENDED</span>
                        </span>
                      )}
                    </div>
                    {isCurrentActive ? (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: "#ef4444",
                          color: "#ffffff",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        <Check size={10} strokeWidth={3} />
                        <span>ACTIVE</span>
                      </span>
                    ) : (
                      <ShieldAlert size={14} color="#ef4444" />
                    )}
                  </div>
                  <h4
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#0f172a",
                      margin: "2px 0",
                    }}
                  >
                    Critical Emergency Shield
                  </h4>
                  <p
                    style={{
                      fontSize: 10.5,
                      color: "#64748b",
                      margin: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    Tight queue at 50 students. Guarantees 0 Vercel 429 lockouts.
                  </p>
                </div>
                <button
                  onClick={() => !isCurrentActive && handleApplyPolicy("CRITICAL_SHIELD")}
                  disabled={isCurrentActive || applyingPolicy !== null}
                  style={{
                    marginTop: 10,
                    width: "100%",
                    padding: "6px",
                    background: isCurrentActive ? "#e2e8f0" : "#ef4444",
                    color: isCurrentActive ? "#475569" : "#ffffff",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    border: isCurrentActive ? "1px solid #cbd5e1" : "none",
                    cursor: isCurrentActive
                      ? "default"
                      : applyingPolicy
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {isCurrentActive
                    ? "Currently Active"
                    : applyingPolicy === "CRITICAL_SHIELD"
                    ? "Applying..."
                    : "Apply Mode"}
                </button>
              </div>
            );
          })()}
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
                <X size={12} />
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
