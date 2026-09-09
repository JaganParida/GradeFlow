import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { getAdminCache, setAdminCache, onAdminCacheDirty, invalidateAdminCache, AdminCacheScopes } from "../utils/adminRealtimeCache";
import {
  ShieldCheck,
  Lock,
  Unlock,
  RefreshCw,
  Clock,
  Eye,
  Flame,
  Route,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export default function AdminTrafficQueueManager({ API, authHeaders, isMobile }) {
  const [liveData, setLiveData] = useState({
    totalActiveUsers: 0,
    totalQueuedUsers: 0,
    maxActiveCapacity: 200,
    queueEnabled: false,
    autoTriggerEnabled: true,
    isQueueActive: false,
    queuedStudents: [],
    routeDistribution: {},
    analytics: {
      allPages: [],
      mostVisited: [],
      mediumVisited: [],
      leastVisited: [],
      totalTrackedViews: 0,
    },
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [capacityInput, setCapacityInput] = useState(200);
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState("MOST");

  const notifySuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const notifyError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(""), 4000);
  };

  const fetchOverview = async (isManual = false) => {
    if (isManual) setRefreshing(true);

    if (!isManual) {
      const cached = getAdminCache("gf_admin_traffic_overview");
      if (cached) {
        setLiveData(cached);
        setCapacityInput(cached.maxActiveCapacity || 200);
        setLoading(false);
        return;
      }
    }

    try {
      const res = await axios.get(`${API}/admin/traffic/live-overview`, {
        withCredentials: true,
        headers: authHeaders,
      });

      if (res.data && res.data.success) {
        setLiveData(res.data);
        setCapacityInput(res.data.maxActiveCapacity || 200);
        setAdminCache("gf_admin_traffic_overview", res.data, AdminCacheScopes.TRAFFIC);
      }
    } catch (err) {
      console.warn("Failed to fetch traffic overview:", err.message);
      if (isManual) setErrorMsg("Failed to refresh traffic and queue data.");
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // Real-time reactive invalidation listener for queue and traffic analytics
  useEffect(() => {
    return onAdminCacheDirty(AdminCacheScopes.TRAFFIC, () => {
      fetchOverview(true);
    });
  }, []);

  const handleToggleQueue = async () => {
    const nextState = !liveData.queueEnabled;
    setActionLoading(true);
    try {
      const res = await axios.post(
        `${API}/admin/traffic/queue/config`,
        { queueEnabled: nextState },
        { withCredentials: true, headers: authHeaders }
      );
      if (res.data?.success) {
        setLiveData((prev) => ({ ...prev, queueEnabled: nextState, isQueueActive: nextState }));
        invalidateAdminCache(AdminCacheScopes.TRAFFIC);
        notifySuccess(
          nextState
            ? "Traffic Queue is now ENABLED. New visitors will be queued."
            : "Traffic Queue has been DISABLED."
        );
      }
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to update queue status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAutoTrigger = async () => {
    const nextState = !liveData.autoTriggerEnabled;
    setActionLoading(true);
    try {
      const res = await axios.post(
        `${API}/admin/traffic/queue/config`,
        { autoTriggerEnabled: nextState },
        { withCredentials: true, headers: authHeaders }
      );
      if (res.data?.success) {
        setLiveData((prev) => ({ ...prev, autoTriggerEnabled: nextState }));
        invalidateAdminCache(AdminCacheScopes.TRAFFIC);
        notifySuccess(
          nextState
            ? "Auto-Queue Trigger enabled on capacity threshold."
            : "Auto-Queue Trigger disabled."
        );
      }
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to update auto-trigger setting");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateCapacity = async () => {
    const cap = parseInt(capacityInput, 10);
    if (isNaN(cap) || cap < 1) {
      notifyError("Please enter a valid capacity number greater than 0.");
      return;
    }
    setIsUpdatingConfig(true);
    try {
      const res = await axios.post(
        `${API}/admin/traffic/queue/config`,
        { maxActiveCapacity: cap },
        { withCredentials: true, headers: authHeaders }
      );
      if (res.data?.success) {
        setLiveData((prev) => ({ ...prev, maxActiveCapacity: cap }));
        invalidateAdminCache(AdminCacheScopes.TRAFFIC);
        notifySuccess(`Active capacity limit set to ${cap} students.`);
      }
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to update capacity limit");
    } finally {
      setIsUpdatingConfig(false);
    }
  };

  const handleAdmitNext = async (count) => {
    setActionLoading(true);
    try {
      const res = await axios.post(
        `${API}/admin/traffic/queue/admit-next`,
        { count },
        { withCredentials: true, headers: authHeaders }
      );
      if (res.data?.success) {
        notifySuccess(res.data.message || `Admitted next ${count} students.`);
        fetchOverview();
      }
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to admit students");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdmitSingleStudent = async (identifier) => {
    try {
      const res = await axios.post(
        `${API}/admin/traffic/queue/admit-student`,
        { identifier },
        { withCredentials: true, headers: authHeaders }
      );
      if (res.data?.success) {
        notifySuccess("Student admitted successfully!");
        fetchOverview();
      }
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to admit student");
    }
  };

  const handleFlushQueue = async (admitAll = true) => {
    if (
      !window.confirm(
        admitAll
          ? "Admit ALL students currently in the queue immediately?"
          : "Clear and reset the waiting queue?"
      )
    ) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await axios.post(
        `${API}/admin/traffic/queue/flush`,
        { admitAll },
        { withCredentials: true, headers: authHeaders }
      );
      if (res.data?.success) {
        notifySuccess(res.data.message);
        fetchOverview();
      }
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to flush queue");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* ── Toast Notifications ── */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              padding: "10px 16px",
              borderRadius: 12,
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#065f46",
              fontSize: 13,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <CheckCircle size={16} color="#059669" /> {successMsg}
          </motion.div>
        )}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              padding: "10px 16px",
              borderRadius: 12,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              fontSize: 13,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertTriangle size={16} color="#dc2626" /> {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Virtual Waiting Queue Controls ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 18,
          padding: isMobile ? "16px" : "20px 24px",
          boxShadow: "0 2px 10px rgba(15, 23, 42, 0.02)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h3
              style={{
                fontSize: 16.5,
                fontWeight: 800,
                color: "#0f172a",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <ShieldCheck size={19} color="#2563eb" /> Virtual Waiting Queue Controls
            </h3>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: "3px 0 0 0" }}>
              Paces student traffic when user volume spikes (e.g. 200+ users). Admin is always exempt.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => fetchOverview(true)}
              disabled={refreshing}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                background: "#f8fafc",
                border: "1.5px solid #e2e8f0",
                color: "#334155",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <RefreshCw size={13} className={refreshing ? "spin" : ""} />
              {refreshing ? "Syncing..." : "Refresh Status"}
            </button>

            {/* Master Queue Switch */}
            <button
              onClick={handleToggleQueue}
              disabled={actionLoading}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                border: "none",
                background: liveData.queueEnabled
                  ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                  : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#ffffff",
                fontSize: 12.5,
                fontWeight: 750,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                boxShadow: liveData.queueEnabled
                  ? "0 2px 8px rgba(239, 68, 68, 0.25)"
                  : "0 2px 8px rgba(16, 185, 129, 0.25)",
              }}
            >
              {liveData.queueEnabled ? <Lock size={14} /> : <Unlock size={14} />}
              {liveData.queueEnabled ? "Queue: ACTIVE (Turn OFF)" : "Queue: INACTIVE (Turn ON)"}
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: 16,
            background: "#f8fafc",
            borderRadius: 14,
            padding: "16px",
            border: "1px solid #e2e8f0",
          }}
        >
          {/* Capacity Threshold Configuration */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                color: "#334155",
                marginBottom: 6,
              }}
            >
              Concurrent Capacity Threshold (e.g. 200 users)
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="number"
                min="1"
                max="10000"
                value={capacityInput}
                onChange={(e) => setCapacityInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1.5px solid #cbd5e1",
                  background: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#0f172a",
                  outline: "none",
                }}
              />
              <button
                onClick={handleUpdateCapacity}
                disabled={isUpdatingConfig}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  background: "#0f172a",
                  color: "#ffffff",
                  border: "none",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {isUpdatingConfig ? "Saving..." : "Save Limit"}
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
              <input
                type="checkbox"
                id="autoTriggerToggle"
                checked={liveData.autoTriggerEnabled}
                onChange={handleToggleAutoTrigger}
                style={{ cursor: "pointer", width: 15, height: 15 }}
              />
              <label
                htmlFor="autoTriggerToggle"
                style={{ fontSize: 12, color: "#475569", fontWeight: 600, cursor: "pointer" }}
              >
                Auto-trigger queue when active students reach {liveData.maxActiveCapacity}+ users
              </label>
            </div>
          </div>

          {/* Batch Actions for Queued Students */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                color: "#334155",
                marginBottom: 6,
              }}
            >
              Queue Batch Actions ({liveData.totalQueuedUsers} waiting)
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => handleAdmitNext(10)}
                disabled={actionLoading || liveData.totalQueuedUsers === 0}
                style={{
                  flex: isMobile ? "1 1 calc(50% - 4px)" : "initial",
                  padding: "8px 14px",
                  borderRadius: 8,
                  background: "#ffffff",
                  border: "1.5px solid #cbd5e1",
                  color: "#0f172a",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: liveData.totalQueuedUsers === 0 ? "not-allowed" : "pointer",
                  opacity: liveData.totalQueuedUsers === 0 ? 0.6 : 1,
                  transition: "all 0.15s ease",
                }}
              >
                Admit 10
              </button>
              <button
                onClick={() => handleAdmitNext(25)}
                disabled={actionLoading || liveData.totalQueuedUsers === 0}
                style={{
                  flex: isMobile ? "1 1 calc(50% - 4px)" : "initial",
                  padding: "8px 14px",
                  borderRadius: 8,
                  background: "#ffffff",
                  border: "1.5px solid #cbd5e1",
                  color: "#0f172a",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: liveData.totalQueuedUsers === 0 ? "not-allowed" : "pointer",
                  opacity: liveData.totalQueuedUsers === 0 ? 0.6 : 1,
                  transition: "all 0.15s ease",
                }}
              >
                Admit 25
              </button>
              <button
                onClick={() => handleFlushQueue(true)}
                disabled={actionLoading || liveData.totalQueuedUsers === 0}
                style={{
                  flex: isMobile ? "1 1 100%" : "initial",
                  padding: "8px 14px",
                  borderRadius: 8,
                  background: "#eff6ff",
                  border: "1.5px solid #bfdbfe",
                  color: "#2563eb",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: liveData.totalQueuedUsers === 0 ? "not-allowed" : "pointer",
                  opacity: liveData.totalQueuedUsers === 0 ? 0.6 : 1,
                  transition: "all 0.15s ease",
                }}
              >
                Admit All ({liveData.totalQueuedUsers})
              </button>
            </div>
            <p style={{ fontSize: 11.5, color: "#64748b", margin: "8px 0 0 0" }}>
              Students admitted receive immediate admission tickets and transition directly to their route.
            </p>
          </div>
        </div>
      </div>

      {/* ── Waiting Queue Table (When students are in queue) ── */}
      {liveData.totalQueuedUsers > 0 && (
        <div
          style={{
            background: "#fffafb",
            border: "1.5px solid #fed7aa",
            borderRadius: 18,
            padding: isMobile ? "16px" : "20px 24px",
            boxShadow: "0 2px 10px rgba(234, 88, 12, 0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#c2410c",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Clock size={18} color="#ea580c" /> Students Waiting in Virtual Queue ({liveData.totalQueuedUsers})
              </h3>
              <p style={{ fontSize: 12.5, color: "#9a3412", margin: "2px 0 0 0" }}>
                Waiting in FIFO order. Click "Admit Now" to grant access to an individual student immediately.
              </p>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, textAlign: "left" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "1.5px solid #fed7aa",
                    color: "#9a3412",
                    fontSize: 11.5,
                    textTransform: "uppercase",
                  }}
                >
                  <th style={{ padding: "8px 10px" }}>Pos</th>
                  <th style={{ padding: "8px 10px" }}>Student / Visitor</th>
                  <th style={{ padding: "8px 10px" }}>Requested Route</th>
                  <th style={{ padding: "8px 10px" }}>Device</th>
                  <th style={{ padding: "8px 10px" }}>Est. Wait</th>
                  <th style={{ padding: "8px 10px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {liveData.queuedStudents.map((q) => (
                  <tr key={q.queueId} style={{ borderBottom: "1px solid #ffedd5" }}>
                    <td style={{ padding: "10px", fontWeight: 800, color: "#c2410c" }}>#{q.position}</td>
                    <td style={{ padding: "10px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{q.studentName}</div>
                      {q.regNo && <div style={{ fontSize: 11.5, color: "#2563eb" }}>{q.regNo}</div>}
                    </td>
                    <td style={{ padding: "10px", fontFamily: "monospace", color: "#475569" }}>
                      {q.requestedRoute}
                    </td>
                    <td style={{ padding: "10px", color: "#64748b" }}>{q.deviceType}</td>
                    <td style={{ padding: "10px", color: "#ea580c", fontWeight: 700 }}>
                      ~ {q.estimatedWaitSecs}s
                    </td>
                    <td style={{ padding: "10px", textAlign: "right" }}>
                      <button
                        onClick={() => handleAdmitSingleStudent(q.queueId)}
                        style={{
                          padding: "5px 12px",
                          borderRadius: 8,
                          background: "#ea580c",
                          color: "#ffffff",
                          border: "none",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Admit Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Page Route Traffic Analytics ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 18,
          padding: isMobile ? "16px" : "20px 24px",
          boxShadow: "0 2px 10px rgba(15, 23, 42, 0.02)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h3
              style={{
                fontSize: 16.5,
                fontWeight: 800,
                color: "#0f172a",
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Route size={19} color="#2563eb" /> Page Route Traffic Analytics
            </h3>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: "3px 0 0 0" }}>
              Dynamically categorized from MongoDB traffic records alongside active viewers right now.
            </p>
          </div>

          {/* Segmented Control */}
          <div
            style={{
              display: "inline-flex",
              background: "#f1f5f9",
              padding: 3,
              borderRadius: 8,
              gap: 3,
              maxWidth: "100%",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
            }}
          >
            <button
              onClick={() => setActiveAnalyticsTab("MOST")}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: activeAnalyticsTab === "MOST" ? "1px solid #e2e8f0" : "1px solid transparent",
                background: activeAnalyticsTab === "MOST" ? "#ffffff" : "transparent",
                color: activeAnalyticsTab === "MOST" ? "#ea580c" : "#64748b",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                whiteSpace: "nowrap",
                boxShadow: activeAnalyticsTab === "MOST" ? "0 1px 3px rgba(15,23,42,0.06)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <Flame size={13} color="#ea580c" /> Most Visited
            </button>
            <button
              onClick={() => setActiveAnalyticsTab("MEDIUM")}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: activeAnalyticsTab === "MEDIUM" ? "1px solid #e2e8f0" : "1px solid transparent",
                background: activeAnalyticsTab === "MEDIUM" ? "#ffffff" : "transparent",
                color: activeAnalyticsTab === "MEDIUM" ? "#2563eb" : "#64748b",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                whiteSpace: "nowrap",
                boxShadow: activeAnalyticsTab === "MEDIUM" ? "0 1px 3px rgba(15,23,42,0.06)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              Medium Visited
            </button>
            <button
              onClick={() => setActiveAnalyticsTab("LEAST")}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: activeAnalyticsTab === "LEAST" ? "1px solid #e2e8f0" : "1px solid transparent",
                background: activeAnalyticsTab === "LEAST" ? "#ffffff" : "transparent",
                color: activeAnalyticsTab === "LEAST" ? "#64748b" : "#64748b",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                whiteSpace: "nowrap",
                boxShadow: activeAnalyticsTab === "LEAST" ? "0 1px 3px rgba(15,23,42,0.06)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              Least Visited
            </button>
            <button
              onClick={() => setActiveAnalyticsTab("ALL")}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: activeAnalyticsTab === "ALL" ? "1px solid #e2e8f0" : "1px solid transparent",
                background: activeAnalyticsTab === "ALL" ? "#ffffff" : "transparent",
                color: activeAnalyticsTab === "ALL" ? "#0f172a" : "#64748b",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                whiteSpace: "nowrap",
                boxShadow: activeAnalyticsTab === "ALL" ? "0 1px 3px rgba(15,23,42,0.06)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              All Pages ({liveData.analytics?.allPages?.length || 0})
            </button>
          </div>
        </div>

        {/* Selected Tier Pages List */}
        {(() => {
          let pagesToShow = [];
          if (activeAnalyticsTab === "MOST") pagesToShow = liveData.analytics?.mostVisited || [];
          else if (activeAnalyticsTab === "MEDIUM") pagesToShow = liveData.analytics?.mediumVisited || [];
          else if (activeAnalyticsTab === "LEAST") pagesToShow = liveData.analytics?.leastVisited || [];
          else pagesToShow = liveData.analytics?.allPages || [];

          if (pagesToShow.length === 0) {
            return (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8", fontSize: 13 }}>
                No page visit analytics recorded yet.
              </div>
            );
          }

          const maxViews = Math.max(...pagesToShow.map((p) => p.totalViews || 0), 1);

          return (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 12,
              }}
            >
              {pagesToShow.map((page, idx) => {
                const liveCount = liveData.routeDistribution?.[page.route] || page.liveViewers || 0;
                const viewPct = Math.round(((page.totalViews || 0) / maxViews) * 100);

                return (
                  <div
                    key={page.route || idx}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 14,
                      padding: "14px 16px",
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
                        gap: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 14 }}>
                          {page.pageTitle || page.route}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#2563eb",
                            fontFamily: "monospace",
                            fontWeight: 600,
                          }}
                        >
                          {page.route}
                        </div>
                      </div>

                      {/* Live Viewers Badge */}
                      <span
                        style={{
                          background: liveCount > 0 ? "#ecfdf5" : "#f1f5f9",
                          border: liveCount > 0 ? "1px solid #a7f3d0" : "1px solid #e2e8f0",
                          color: liveCount > 0 ? "#065f46" : "#64748b",
                          fontSize: 11,
                          fontWeight: 800,
                          padding: "3px 8px",
                          borderRadius: 99,
                          whiteSpace: "nowrap",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <Eye size={12} color={liveCount > 0 ? "#059669" : "#64748b"} />
                        {liveCount} Live
                      </span>
                    </div>

                    {/* Popularity Bar */}
                    <div
                      style={{
                        width: "100%",
                        height: 6,
                        background: "#e2e8f0",
                        borderRadius: 99,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.max(5, viewPct)}%`,
                          height: "100%",
                          background:
                            page.tier === "MOST_VISITED"
                              ? "linear-gradient(90deg, #f97316 0%, #ea580c 100%)"
                              : page.tier === "MEDIUM_VISITED"
                              ? "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)"
                              : "#94a3b8",
                          borderRadius: 99,
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        color: "#64748b",
                      }}
                    >
                      <span>
                        Total Visits: <strong style={{ color: "#0f172a" }}>{page.totalViews || 0}</strong>
                      </span>
                      <span>
                        Unique: <strong style={{ color: "#0f172a" }}>{page.uniqueVisitors || 0}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
