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
  Cpu,
  Layers,
  ArrowUpRight,
  Info,
  ChevronRight,
  Sparkles,
  Lock,
} from "lucide-react";

export default function AdminVercelQuotaMonitor({ API, authHeaders, isMobile }) {
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
        // Refresh metrics state
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
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
        <div className="inline-flex items-center justify-center p-3 bg-violet-50 text-violet-600 rounded-xl mb-4 animate-spin">
          <RefreshCw size={24} />
        </div>
        <h3 className="text-base font-semibold text-slate-800">
          Calculating Vercel Hobby Quota & Traffic Telemetry...
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Querying on-demand serverless invocations, bandwidth and peak hour telemetry.
        </p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 shadow-sm text-center">
        <div className="inline-flex items-center justify-center p-3 bg-rose-50 text-rose-600 rounded-xl mb-3">
          <AlertTriangle size={24} />
        </div>
        <h3 className="text-base font-semibold text-slate-800">
          Failed to Calculate Quota Intelligence
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">{error}</p>
        <button
          onClick={() => fetchQuotaMetrics(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
        >
          <RefreshCw size={14} /> Retry Calculation
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
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* ── HEADER BANNER: ZERO-DRAIN ARCHITECTURE & REFRESH ── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-4 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 bg-violet-500/20 text-violet-300 rounded-lg border border-violet-500/30">
                <Zap size={16} />
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                Vercel Free Hobby Quota & Traffic Engine
              </h2>
              <span className="hidden sm:inline-block px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                Zero-Drain Mode
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time calculations computed strictly <span className="font-semibold text-white">on-demand</span> when you visit this page. Zero periodic intervals or background heartbeats to protect your 100,000 monthly serverless quota.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-[11px] text-slate-400">Calculated At</div>
              <div className="text-xs font-medium text-slate-200">
                {timestamp ? new Date(timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Just now"}
              </div>
            </div>

            <button
              onClick={() => fetchQuotaMetrics(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/20 rounded-xl text-xs font-semibold text-white transition disabled:opacity-50 cursor-pointer backdrop-blur-sm"
              title="Refresh Quota Metrics On-Demand"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin text-violet-400" : ""} />
              <span>{refreshing ? "Calculating..." : "Refresh Metrics"}</span>
            </button>
          </div>
        </div>

        {/* Policy Feedback Notification */}
        {policyMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-3 rounded-xl text-xs font-medium border flex items-center justify-between ${
              policyMessage.type === "success"
                ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
                : "bg-rose-950/60 border-rose-500/40 text-rose-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {policyMessage.type === "success" ? (
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertTriangle size={16} className="text-rose-400 flex-shrink-0" />
              )}
              <span>{policyMessage.text}</span>
            </div>
            <button
              onClick={() => setPolicyMessage(null)}
              className="text-slate-400 hover:text-white text-xs px-2"
            >
              ✕
            </button>
          </motion.div>
        )}
      </div>

      {/* ── 4 KEY KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: TODAY'S REQUESTS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Today's Invocations
              </span>
              <span
                className={`px-2 py-0.5 text-[11px] font-bold rounded-full border ${
                  today.status === "CRITICAL"
                    ? "bg-rose-50 text-rose-600 border-rose-200"
                    : today.status === "WARNING"
                    ? "bg-amber-50 text-amber-600 border-amber-200"
                    : "bg-emerald-50 text-emerald-600 border-emerald-200"
                }`}
              >
                {today.percent}% of Day
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {today.used.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-slate-400">
                / {today.budget.toLocaleString()} reqs
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  today.percent >= 90
                    ? "bg-rose-500"
                    : today.percent >= 70
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(100, today.percent)}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Remaining Today:</span>
            <span className="font-semibold text-slate-800">
              {today.remaining.toLocaleString()} reqs
            </span>
          </div>
        </div>

        {/* CARD 2: MONTHLY HOBBY LIMIT (100k) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Monthly Quota (100k)
              </span>
              <span
                className={`px-2 py-0.5 text-[11px] font-bold rounded-full border ${
                  month.projectionStatus === "OVER_BUDGET"
                    ? "bg-rose-50 text-rose-600 border-rose-200"
                    : month.projectionStatus === "AT_RISK"
                    ? "bg-amber-50 text-amber-600 border-amber-200"
                    : "bg-indigo-50 text-indigo-600 border-indigo-200"
                }`}
              >
                {month.percent}% Used
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {month.used.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-slate-400">
                / {month.limit.toLocaleString()}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  month.percent >= 90
                    ? "bg-rose-500"
                    : month.percent >= 70
                    ? "bg-amber-500"
                    : "bg-indigo-600"
                }`}
                style={{ width: `${Math.min(100, month.percent)}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Projected Month-End:</span>
            <span
              className={`font-semibold ${
                month.projectionStatus === "OVER_BUDGET"
                  ? "text-rose-600"
                  : month.projectionStatus === "AT_RISK"
                  ? "text-amber-600"
                  : "text-slate-800"
              }`}
            >
              ~{month.projectedMonthEndRequests.toLocaleString()} ({month.projectedMonthPercent}%)
            </span>
          </div>
        </div>

        {/* CARD 3: FAST DATA TRANSFER (BANDWIDTH) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Origin Bandwidth
              </span>
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-cyan-50 text-cyan-600 border border-cyan-200">
                {bandwidth.percent}% of 100GB
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {bandwidth.usedGB}
              </span>
              <span className="text-xs font-medium text-slate-400">
                / {bandwidth.limitGB} GB
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, bandwidth.percent)}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Hobby Balance:</span>
            <span className="font-semibold text-slate-800">
              {bandwidth.remainingGB} GB free
            </span>
          </div>
        </div>

        {/* CARD 4: AUTO-DEFENSE ENGINE STATUS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Enterprise Defense
              </span>
              <span
                className={`px-2 py-0.5 text-[11px] font-bold rounded-full border ${
                  defenseSystem.currentQueueEnabled
                    ? "bg-amber-50 text-amber-600 border-amber-200"
                    : "bg-emerald-50 text-emerald-600 border-emerald-200"
                }`}
              >
                {defenseSystem.currentQueueEnabled ? "Queue Active" : "Direct Pass"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full animate-pulse ${
                  defenseSystem.recommendedDefensePolicy === "CRITICAL_SHIELD"
                    ? "bg-rose-500"
                    : defenseSystem.recommendedDefensePolicy === "SURGE_PROTECTION"
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
              />
              <span className="text-sm font-bold text-slate-900">
                {defenseSystem.defenseBadge}
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
              {defenseSystem.defenseDescription}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Capacity Cap:</span>
            <span className="font-semibold text-slate-800">
              {defenseSystem.maxActiveCapacity} active students
            </span>
          </div>
        </div>
      </div>

      {/* ── PEAK TIMING & TRAFFIC SURGE INTELLIGENCE ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="text-violet-600" size={18} />
              <h3 className="text-base font-bold text-slate-900">
                Peak Timing & Surge Intelligence
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Exact peak hour and day when student traffic surges the highest, calculated from 24-hour serverless telemetry.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 bg-violet-50 border border-violet-100 rounded-xl flex items-center gap-2 text-xs">
              <span className="text-violet-500 font-medium">Peak Hour:</span>
              <span className="font-bold text-violet-950">{peakTiming?.peakHourText || "8:00 PM – 9:00 PM"}</span>
            </div>
            <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2 text-xs">
              <span className="text-indigo-500 font-medium">Peak Day:</span>
              <span className="font-bold text-indigo-950">{peakTiming?.peakDayText || "Tuesday"}</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Students Tracked:</span>
              <span className="font-bold text-slate-800">{peakTiming?.totalActiveStudents || 0}</span>
            </div>
          </div>
        </div>

        {/* 24-Hour Traffic Distribution Histogram */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">
              24-Hour Request Volume Histogram (IST)
            </span>
            {activeHistogramHour !== null && (
              <span className="text-xs text-violet-600 font-semibold animate-fade-in">
                {activeHistogramHour.label}: {activeHistogramHour.requests.toLocaleString()} requests ({activeHistogramHour.percentage}%)
              </span>
            )}
          </div>

          <div className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-100">
            <div className="h-32 sm:h-40 flex items-end gap-1 sm:gap-1.5 pt-4 pb-1">
              {(peakTiming?.hourlyDistribution || []).map((h) => {
                const isPeak = h.hour === peakTiming.peakHourIndex;
                const heightPercent = maxHistogramRequests > 0
                  ? Math.max(8, Math.round((h.requests / maxHistogramRequests) * 100))
                  : 8;

                return (
                  <div
                    key={h.hour}
                    onMouseEnter={() => setActiveHistogramHour(h)}
                    onMouseLeave={() => setActiveHistogramHour(null)}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                  >
                    {/* Crown badge for Peak Hour */}
                    {isPeak && (
                      <div className="mb-1 text-[10px] text-amber-500 font-bold animate-bounce">
                        ★
                      </div>
                    )}

                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        isPeak
                          ? "bg-gradient-to-t from-violet-600 to-indigo-500 shadow-md shadow-violet-200"
                          : "bg-slate-300 group-hover:bg-violet-400"
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />

                    {/* Tooltip on Hover */}
                    <div className="absolute -top-10 bg-slate-900 text-white text-[10px] font-semibold py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition pointer-events-none z-20 whitespace-nowrap shadow-lg">
                      {h.label}: {h.requests} reqs
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 24-Hour Horizontal Labels */}
            <div className="flex justify-between text-[9px] sm:text-[10px] text-slate-600 font-bold pt-2 border-t border-slate-200 px-1">
              <span>12 AM</span>
              <span>3 AM</span>
              <span>6 AM</span>
              <span>9 AM</span>
              <span>12 PM</span>
              <span>3 PM</span>
              <span className="text-violet-700 font-black">6 PM - 9 PM</span>
              <span>11 PM</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── ENTERPRISE AUTO-DEFENSE SYSTEM (AUTO-HANDLING TRAFFIC) ── */}
      <div className="bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/70 rounded-2xl border border-indigo-100 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-indigo-600" size={20} />
              <h3 className="text-base font-bold text-slate-900">
                Automated Traffic Defense Policies
              </h3>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              GradeFlow uses smart traffic coalescing and priority virtual queueing (the same pattern high-scale apps use) to guarantee you never get 429 quota locked on Vercel's Free Hobby Tier.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start">
            <span className="text-xs text-slate-500">Active Policy:</span>
            <span className="px-3 py-1 bg-indigo-600 text-white font-bold text-xs rounded-full shadow-sm">
              {defenseSystem.defenseBadge}
            </span>
          </div>
        </div>

        {/* 3 PRE-SET POLICY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* POLICY 1: OPTIMAL */}
          <div
            className={`bg-white rounded-xl border p-4 transition flex flex-col justify-between ${
              defenseSystem.recommendedDefensePolicy === "OPTIMAL"
                ? "border-emerald-400 ring-2 ring-emerald-100 shadow-sm"
                : "border-slate-200"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Normal Traffic (&lt;70%)
                </span>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-1">
                Optimal Speed Mode
              </h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Direct serverless invocation. Queue is turned off. Capacity cap set to 250 active students. Best user experience.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Free Tier Safe</span>
              <button
                onClick={() => handleApplyPolicy("OPTIMAL")}
                disabled={applyingPolicy !== null}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                {applyingPolicy === "OPTIMAL" ? "Applying..." : "Apply Mode"}
              </button>
            </div>
          </div>

          {/* POLICY 2: SURGE PROTECTION */}
          <div
            className={`bg-white rounded-xl border p-4 transition flex flex-col justify-between ${
              defenseSystem.recommendedDefensePolicy === "SURGE_PROTECTION"
                ? "border-amber-400 ring-2 ring-amber-100 shadow-sm"
                : "border-slate-200"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Elevated Surge (70% - 90%)
                </span>
                <TrendingUp size={16} className="text-amber-500" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-1">
                Surge Protection Mode
              </h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Activates auto-queueing at 150 active students. Paces incoming requests and enforces aggressive Edge SWR caching.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Protects 3.3k Budget</span>
              <button
                onClick={() => handleApplyPolicy("SURGE_PROTECTION")}
                disabled={applyingPolicy !== null}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                {applyingPolicy === "SURGE_PROTECTION" ? "Applying..." : "Apply Mode"}
              </button>
            </div>
          </div>

          {/* POLICY 3: CRITICAL EMERGENCY SHIELD */}
          <div
            className={`bg-white rounded-xl border p-4 transition flex flex-col justify-between ${
              defenseSystem.recommendedDefensePolicy === "CRITICAL_SHIELD"
                ? "border-rose-400 ring-2 ring-rose-100 shadow-sm"
                : "border-slate-200"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  High Risk (&gt;90%)
                </span>
                <ShieldAlert size={16} className="text-rose-500" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-1">
                Critical Emergency Shield
              </h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Tight virtual queue at 50 active students. Throttles heavy endpoints to guarantee zero Vercel 429 quota exhaustion.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Zero 429 Lockout</span>
              <button
                onClick={() => handleApplyPolicy("CRITICAL_SHIELD")}
                disabled={applyingPolicy !== null}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                {applyingPolicy === "CRITICAL_SHIELD" ? "Applying..." : "Apply Mode"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROUTE-BY-ROUTE CONSUMPTION BREAKDOWN ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="text-slate-700" size={18} />
              <h3 className="text-base font-bold text-slate-900">
                Route-by-Route Request & Bandwidth Breakdown
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Ranked by serverless invocations and bandwidth consumed on Vercel.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Total Tracked Routes: {(routeBreakdown || []).length}
          </span>
        </div>

        {/* Responsive Table / Card View */}
        {isMobile ? (
          <div className="space-y-3 mt-4">
            {(routeBreakdown || []).map((routeItem, idx) => (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {routeItem.pageTitle}
                    </div>
                    <code className="text-[11px] text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded font-mono">
                      {routeItem.route}
                    </code>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full border whitespace-nowrap ${
                      routeItem.priorityTier === "HIGH_CONSUMPTION"
                        ? "bg-rose-50 text-rose-600 border-rose-200"
                        : routeItem.priorityTier === "MEDIUM_CONSUMPTION"
                        ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {routeItem.priorityTier.replace("_", " ")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Estimated Invocations</span>
                    <span className="font-bold text-slate-800">
                      {routeItem.estimatedInvocations.toLocaleString()} ({routeItem.percentOfTotal}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Bandwidth Consumed</span>
                    <span className="font-bold text-slate-800">
                      {routeItem.bandwidthMB} MB
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Recommended Cache:</span>
                  <span className="font-medium text-slate-700 truncate max-w-[200px]">
                    {routeItem.cacheRecommendation}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto mt-4 rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Route / Page</th>
                  <th className="py-3 px-4">Serverless Reqs</th>
                  <th className="py-3 px-4">Traffic Share</th>
                  <th className="py-3 px-4">Bandwidth (MB)</th>
                  <th className="py-3 px-4">Consumption Tier</th>
                  <th className="py-3 px-4">Recommended Caching Policy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(routeBreakdown || []).map((routeItem, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {routeItem.pageTitle}
                      </div>
                      <code className="text-[11px] text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded font-mono">
                        {routeItem.route}
                      </code>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {routeItem.estimatedInvocations.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 w-10">
                          {routeItem.percentOfTotal}%
                        </span>
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-violet-600 rounded-full"
                            style={{ width: `${Math.min(100, routeItem.percentOfTotal)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {routeItem.bandwidthMB} MB
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                          routeItem.priorityTier === "HIGH_CONSUMPTION"
                            ? "bg-rose-50 text-rose-600 border-rose-200"
                            : routeItem.priorityTier === "MEDIUM_CONSUMPTION"
                            ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {routeItem.priorityTier.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="px-2 py-1 bg-slate-100 rounded-md font-mono text-[10px]">
                        {routeItem.cacheRecommendation}
                      </span>
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
