import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Megaphone,
  Trophy,
  Calendar,
  Compass,
  AlertTriangle,
  ArrowRight,
  Check,
  Trash2,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  Link2,
  Users,
  Loader2,
  ExternalLink,
} from "lucide-react";

const CATEGORY_OPTIONS = [
  {
    id: "RESULT_ANNOUNCEMENT",
    label: "Results Published",
    badge: "Results",
    badgeColor: "blue",
    icon: <Trophy size={16} color="#2563eb" />,
    defaultRoute: "/leaderboard",
    defaultTitle: "Odd Semester Results Published!",
    defaultMessage: "Official semester results and section rank lists have been published. Check your score now.",
    defaultPrimary: "Check Now",
  },
  {
    id: "BROADCAST_ANNOUNCEMENT",
    label: "Important Announcement",
    badge: "Important",
    badgeColor: "amber",
    icon: <Megaphone size={16} color="#d97706" />,
    defaultRoute: "/dashboard",
    defaultTitle: "Campus Academic Notice",
    defaultMessage: "Important updates regarding upcoming academic registrations and attendance requirements.",
    defaultPrimary: "Check Details",
  },
  {
    id: "TIMETABLE_UPDATE",
    label: "Timetable Updated",
    badge: "Schedule",
    badgeColor: "purple",
    icon: <Calendar size={16} color="#7c3aed" />,
    defaultRoute: "/timetable",
    defaultTitle: "Updated Class Timetable Released",
    defaultMessage: "Class routines and lab schedules have been updated for all batches. View your new timetable.",
    defaultPrimary: "View Timetable",
  },
  {
    id: "FEATURE_EXPLORE",
    label: "New Feature / Explore",
    badge: "New Feature",
    badgeColor: "green",
    icon: <Compass size={16} color="#059669" />,
    defaultRoute: "/attendance",
    defaultTitle: "Explore Attendance Calculator",
    defaultMessage: "Check out the smart attendance target planner and margin tracker to stay above 75%.",
    defaultPrimary: "Explore Page",
  },
  {
    id: "URGENT_ALERT",
    label: "Urgent Alert",
    badge: "Urgent",
    badgeColor: "red",
    icon: <AlertTriangle size={16} color="#dc2626" />,
    defaultRoute: "/dashboard",
    defaultTitle: "Urgent Verification Notice",
    defaultMessage: "Please review and complete your pending university document verification immediately.",
    defaultPrimary: "Check Now",
  },
];

const ROUTE_SHORTCUTS = [
  { label: "Rankings & Leaderboard", route: "/leaderboard" },
  { label: "Attendance Tracker & Calculator", route: "/attendance" },
  { label: "Timetable & Calendar", route: "/timetable" },
  { label: "Student Dashboard", route: "/dashboard" },
  { label: "Academic Analytics", route: "/analytics" },
  { label: "Study Resources & Notes", route: "/resources" },
  { label: "Student Testimonials", route: "/testimonials" },
  { label: "About Developer", route: "/about-dev" },
  { label: "Home Page", route: "/" },
];

export default function AdminNotificationBroadcast({ API, authHeaders, isMobile = false }) {
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [title, setTitle] = useState(CATEGORY_OPTIONS[0].defaultTitle);
  const [message, setMessage] = useState(CATEGORY_OPTIONS[0].defaultMessage);
  const [primaryLabel, setPrimaryLabel] = useState(CATEGORY_OPTIONS[0].defaultPrimary);
  const [secondaryLabel, setSecondaryLabel] = useState("Understood");
  const [targetRoute, setTargetRoute] = useState(CATEGORY_OPTIONS[0].defaultRoute);
  const [customRoute, setCustomRoute] = useState("");
  const [expiresInHours, setExpiresInHours] = useState(72);

  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackErr, setFeedbackErr] = useState("");

  const [broadcasts, setBroadcasts] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedBroadcast, setExpandedBroadcast] = useState(null);

  useEffect(() => {
    fetchBroadcasts();
    // Auto-refresh broadcast counts every 8s for real-time read/dismiss tracking
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      fetchBroadcasts();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const fetchBroadcasts = async () => {
    setHistoryLoading(true);
    try {
      const res = await axios.get(`${API}/admin/notifications/broadcasts`, authHeaders);
      if (res.data?.success) {
        setBroadcasts(res.data.broadcasts || []);
      }
    } catch {
      // Fallback endpoint
      try {
        const res2 = await axios.get(`${API}/notifications?action=admin-broadcast-list`, authHeaders);
        if (res2.data?.success) {
          setBroadcasts(res2.data.broadcasts || []);
        }
      } catch {}
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSelectCategory = (cat) => {
    setCategory(cat);
    setTitle(cat.defaultTitle);
    setMessage(cat.defaultMessage);
    setPrimaryLabel(cat.defaultPrimary);
    setTargetRoute(cat.defaultRoute);
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setFeedbackErr("Please fill in both the title and message.");
      return;
    }

    const finalRoute = targetRoute === "custom" ? customRoute.trim() : targetRoute;

    setLoading(true);
    setFeedbackMsg("");
    setFeedbackErr("");

    const payload = {
      title: title.trim(),
      message: message.trim(),
      type: category.id,
      badge: category.badge,
      badgeColor: category.badgeColor,
      primaryButton: {
        label: primaryLabel.trim() || "Check Now",
        action: "NAVIGATE",
        targetRoute: finalRoute,
      },
      secondaryButton: {
        label: secondaryLabel.trim() || "Understood",
        action: "DISMISS",
      },
      targetAudience: "ALL",
      expiresInHours: Number(expiresInHours),
    };

    try {
      let res;
      try {
        res = await axios.post(`${API}/admin/notifications/broadcast`, payload, authHeaders);
      } catch {
        res = await axios.post(`${API}/notifications?action=admin-broadcast`, payload, authHeaders);
      }

      if (res.data?.success) {
        setFeedbackMsg(res.data.message || "Broadcast notification sent to all students successfully!");
        fetchBroadcasts();
        setTimeout(() => setFeedbackMsg(""), 6000);
      } else {
        setFeedbackErr(res.data?.message || "Failed to publish broadcast.");
      }
    } catch (err) {
      setFeedbackErr(err.response?.data?.message || "Error publishing broadcast notification.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBroadcast = async (notificationId) => {
    if (!window.confirm("Are you sure you want to delete this broadcast notification? It will be removed from all student views.")) {
      return;
    }

    try {
      let res;
      try {
        res = await axios.delete(`${API}/admin/notifications/broadcast/${notificationId}`, {
          ...authHeaders,
          data: { notificationId },
        });
      } catch {
        res = await axios.post(
          `${API}/notifications?action=admin-broadcast-delete`,
          { notificationId },
          authHeaders
        );
      }

      if (res.data?.success) {
        setBroadcasts((prev) => prev.filter((b) => b.notificationId !== notificationId));
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete broadcast.");
    }
  };

  const getBadgeVisual = (catBadge) => {
    const b = (catBadge || "").toLowerCase();
    if (b.includes("result")) return { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" };
    if (b.includes("schedule") || b.includes("timetable")) return { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" };
    if (b.includes("feature")) return { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" };
    if (b.includes("urgent") || b.includes("alert")) return { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" };
    return { bg: "#fffbeb", color: "#b45309", border: "#fde68a" };
  };

  const activeBroadcastCount = broadcasts.filter((b) => !b.expiresAt || new Date(b.expiresAt) > new Date()).length;
  const totalReadCount = broadcasts.reduce((sum, b) => sum + (b.readCount || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Top Header Banner ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: isMobile ? "16px 14px" : "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#eff6ff",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Bell size={22} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Broadcast Notifications & Action Alerts
              </h2>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  background: "#eff6ff",
                  color: "#2563eb",
                  padding: "2px 8px",
                  borderRadius: 99,
                  border: "1px solid #dbeafe",
                }}
              >
                All Students
              </span>
            </div>
            <p style={{ fontSize: 12.5, color: "#64748b", margin: "3px 0 0 0" }}>
              Publish instant push notifications with two customizable action buttons to all registered students in real-time.
            </p>
          </div>
        </div>

        {/* Quick Stats Pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: "6px 12px",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Sparkles size={14} color="#2563eb" />
            <span style={{ color: "#64748b" }}>Active Broadcasts:</span>
            <strong style={{ color: "#0f172a" }}>{activeBroadcastCount}</strong>
          </div>

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: "6px 12px",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Eye size={14} color="#059669" />
            <span style={{ color: "#64748b" }}>Total Clicks / Reads:</span>
            <strong style={{ color: "#059669" }}>{totalReadCount}</strong>
          </div>
        </div>
      </div>

      {/* ── Main Layout: Composer Form + Live Preview ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.35fr) minmax(320px, 0.95fr)",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* Composer Form Card */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: isMobile ? "16px 14px" : "22px 24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f1f5f9" }}>
            <Megaphone size={16} color="#2563eb" />
            <span style={{ fontWeight: 800, color: "#0f172a", fontSize: 14 }}>
              Compose Student Announcement
            </span>
          </div>

          {feedbackMsg && (
            <div
              style={{
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                color: "#065f46",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 12.5,
                fontWeight: 600,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <CheckCircle2 size={16} color="#059669" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          {feedbackErr && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 12.5,
                fontWeight: 600,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AlertTriangle size={16} color="#dc2626" />
              <span>{feedbackErr}</span>
            </div>
          )}

          <form onSubmit={handleSendBroadcast} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* 1. Category Selector */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
                Select Announcement Category:
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {CATEGORY_OPTIONS.map((cat) => {
                  const isSelected = category.id === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: isSelected ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                        background: isSelected ? "#eff6ff" : "#ffffff",
                        color: isSelected ? "#2563eb" : "#475569",
                        fontSize: 12,
                        fontWeight: isSelected ? 800 : 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        transition: "all 0.15s ease",
                      }}
                    >
                      {cat.icon}
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Announcement Title */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                Notification Title:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Odd Semester Results Published!"
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  fontWeight: 600,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* 3. Announcement Message */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>
                  Message Description:
                </label>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{message.length} characters</span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write the message content that students will see..."
                rows={3}
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                  lineHeight: 1.45,
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* 4. Action Buttons Configuration (2 Buttons) */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                <Link2 size={14} color="#2563eb" />
                <span>Configure Two Action Buttons:</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                {/* Button 1 (Primary Action) */}
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Primary Button Label (Redirects / Read):
                  </label>
                  <input
                    type="text"
                    value={primaryLabel}
                    onChange={(e) => setPrimaryLabel(e.target.value)}
                    placeholder="Check Now"
                    required
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 12.5,
                      fontWeight: 600,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Button 2 (Secondary Action) */}
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Secondary Button Label (Dismiss):
                  </label>
                  <input
                    type="text"
                    value={secondaryLabel}
                    onChange={(e) => setSecondaryLabel(e.target.value)}
                    placeholder="Understood"
                    required
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 12.5,
                      fontWeight: 600,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Target Page Link for Primary Button */}
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Target Website Page to Redirect on "Check Now":
                </label>
                <select
                  value={targetRoute}
                  onChange={(e) => setTargetRoute(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 12.5,
                    fontWeight: 600,
                    background: "#ffffff",
                    boxSizing: "border-box",
                  }}
                >
                  {ROUTE_SHORTCUTS.map((r) => (
                    <option key={r.route} value={r.route}>
                      {r.label} ({r.route})
                    </option>
                  ))}
                  <option value="custom">Custom Internal Route or External URL...</option>
                </select>

                {targetRoute === "custom" && (
                  <input
                    type="text"
                    value={customRoute}
                    onChange={(e) => setCustomRoute(e.target.value)}
                    placeholder="/custom-page or https://..."
                    style={{
                      width: "100%",
                      marginTop: 8,
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #2563eb",
                      fontSize: 12.5,
                      boxSizing: "border-box",
                    }}
                  />
                )}
              </div>
            </div>

            {/* 5. Expiration & Submit */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Clock size={14} color="#64748b" />
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Expires in:</span>
                <select
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(e.target.value)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    fontSize: 12,
                    background: "#ffffff",
                  }}
                >
                  <option value={24}>24 Hours (1 Day)</option>
                  <option value={48}>48 Hours (2 Days)</option>
                  <option value={72}>72 Hours (3 Days)</option>
                  <option value={168}>7 Days (1 Week)</option>
                  <option value={0}>Never Expire</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: loading ? "#94a3b8" : "#2563eb",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    <span>Publishing to All Students...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Send Broadcast to All Students</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Card Preview Box */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: "18px 20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Eye size={15} color="#2563eb" />
                <span style={{ fontWeight: 800, fontSize: 13, color: "#0f172a" }}>
                  Live Notification Popup Preview
                </span>
              </div>
              <span style={{ fontSize: 11, color: "#059669", fontWeight: 700, background: "#ecfdf5", padding: "2px 7px", borderRadius: 6 }}>
                Student View
              </span>
            </div>

            {/* Simulated Notification Card */}
            <div
              style={{
                background: "#f8faff",
                border: "1.5px solid #bfdbfe",
                borderRadius: 12,
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {/* Header inside card */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: category.badgeColor === "blue" ? "#eff6ff" : category.badgeColor === "green" ? "#ecfdf5" : category.badgeColor === "purple" ? "#f5f3ff" : category.badgeColor === "red" ? "#fef2f2" : "#fffbeb",
                    border: "1px solid #dbeafe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {category.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                        {title || "Announcement Title"}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: 5,
                          background: "#eff6ff",
                          color: "#2563eb",
                          border: "1px solid #dbeafe",
                          textTransform: "uppercase",
                        }}
                      >
                        {category.badge}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Just now</span>
                  </div>

                  <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.45, marginTop: 4 }}>
                    {message || "Message description will show here..."}
                  </div>
                </div>
              </div>

              {/* 2 Buttons Row inside card */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 4,
                  paddingTop: 8,
                  borderTop: "1px solid #f1f5f9",
                }}
              >
                <button
                  type="button"
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    color: "#64748b",
                    fontSize: 12,
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    cursor: "default",
                  }}
                >
                  <Check size={13} />
                  <span>{secondaryLabel || "Understood"}</span>
                </button>

                <button
                  type="button"
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    background: "#2563eb",
                    border: "none",
                    color: "#ffffff",
                    fontSize: 12,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    boxShadow: "0 2px 6px rgba(37, 99, 235, 0.22)",
                    cursor: "default",
                  }}
                >
                  <span>{primaryLabel || "Check Now"}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>

            <div style={{ marginTop: 14, fontSize: 11.5, color: "#64748b", lineHeight: 1.4 }}>
              💡 <strong>How it behaves:</strong> When a student clicks <strong>"{primaryLabel || "Check Now"}"</strong>, it marks the announcement as read and directly redirects them to <code>{targetRoute === "custom" ? customRoute || "/..." : targetRoute}</code>. Clicking <strong>"{secondaryLabel || "Understood"}"</strong> dismisses the card.
            </div>
          </div>
        </div>
      </div>

      {/* ── Broadcast History Table ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: isMobile ? "16px 14px" : "20px 24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Clock size={16} color="#0f172a" />
            <span style={{ fontWeight: 800, color: "#0f172a", fontSize: 14 }}>
              Active & Sent Broadcasts ({broadcasts.length})
            </span>
          </div>

          <button
            type="button"
            onClick={fetchBroadcasts}
            disabled={historyLoading}
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "4px 10px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {historyLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {broadcasts.length === 0 ? (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
            No broadcast notifications published yet. Use the composer above to broadcast an announcement!
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px" }}>Notification Title & Badge</th>
                  <th style={{ padding: "10px 12px" }}>Target Page Route</th>
                  <th style={{ padding: "10px 12px" }}>Sent Date</th>
                  <th style={{ padding: "10px 12px" }}>Reads / Clicks</th>
                  <th style={{ padding: "10px 12px" }}>Dismissed</th>
                  <th style={{ padding: "10px 12px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {broadcasts.map((b) => {
                  const isExpired = b.expiresAt && new Date(b.expiresAt) <= new Date();
                  const badgeVisual = getBadgeVisual(b.badge);

                  return (
                    <React.Fragment key={b.notificationId}>
                      <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 700,
                                padding: "2px 7px",
                                borderRadius: 5,
                                background: badgeVisual.bg,
                                color: badgeVisual.color,
                                border: `1px solid ${badgeVisual.border}`,
                              }}
                            >
                              {b.badge || "Announcement"}
                            </span>
                            <div>
                              <strong style={{ color: "#0f172a" }}>{b.title}</strong>
                              <div style={{ fontSize: 11.5, color: "#64748b", maxWidth: 280, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                {b.message}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: "12px" }}>
                          <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, fontSize: 11.5, color: "#2563eb" }}>
                            {b.primaryButton?.targetRoute || "/dashboard"}
                          </code>
                        </td>

                        <td style={{ padding: "12px", color: "#64748b" }}>
                          {new Date(b.createdAt).toLocaleDateString()} · {new Date(b.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {isExpired && <span style={{ marginLeft: 6, color: "#dc2626", fontWeight: 700 }}>(Expired)</span>}
                        </td>

                        <td style={{ padding: "12px" }}>
                          <button
                            type="button"
                            onClick={() => setExpandedBroadcast(expandedBroadcast === b.notificationId ? null : b.notificationId)}
                            style={{
                              background: expandedBroadcast === b.notificationId ? "#ecfdf5" : "none",
                              border: expandedBroadcast === b.notificationId ? "1px solid #a7f3d0" : "none",
                              borderRadius: 6,
                              cursor: "pointer",
                              padding: "2px 6px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              transition: "all 0.15s ease",
                            }}
                            title="Click to view students who read this"
                          >
                            <strong style={{ color: "#059669" }}>{b.readCount || 0}</strong>
                            <span style={{ color: "#64748b" }}>students</span>
                            <Eye size={12} color="#059669" />
                          </button>
                        </td>

                        <td style={{ padding: "12px" }}>
                          <button
                            type="button"
                            onClick={() => setExpandedBroadcast(expandedBroadcast === b.notificationId ? null : b.notificationId)}
                            style={{
                              background: expandedBroadcast === b.notificationId ? "#f5f3ff" : "none",
                              border: expandedBroadcast === b.notificationId ? "1px solid #ddd6fe" : "none",
                              borderRadius: 6,
                              cursor: "pointer",
                              padding: "2px 6px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              transition: "all 0.15s ease",
                            }}
                            title="Click to view students who dismissed this"
                          >
                            <span style={{ color: "#64748b" }}>{b.dismissedCount || 0} students</span>
                            <Eye size={12} color="#7c3aed" />
                          </button>
                        </td>

                        <td style={{ padding: "12px", textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteBroadcast(b.notificationId)}
                            style={{
                              background: "#fef2f2",
                              border: "1px solid #fecaca",
                              color: "#dc2626",
                              padding: "4px 8px",
                              borderRadius: 6,
                              fontSize: 11.5,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                            title="Delete this broadcast"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Real-Time Student Details Row */}
                      {expandedBroadcast === b.notificationId && (
                        <tr>
                          <td colSpan={6} style={{ padding: "0 12px 14px 12px", background: "#f8fafc" }}>
                            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", padding: "12px 0" }}>
                              {/* Read / Clicked Details */}
                              <div style={{ flex: 1, minWidth: 280 }}>
                                <div style={{ fontWeight: 700, fontSize: 12, color: "#059669", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                                  <CheckCircle2 size={14} color="#059669" />
                                  <span>Students Read / Interacted ({b.readDetails?.length || 0})</span>
                                </div>
                                {(!b.readDetails || b.readDetails.length === 0) ? (
                                  <div style={{ fontSize: 11.5, color: "#94a3b8", padding: "8px 0" }}>
                                    No students have read or clicked this announcement yet.
                                  </div>
                                ) : (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 240, overflowY: "auto" }}>
                                    {b.readDetails.map((r, idx) => (
                                      <div
                                        key={`${r.regNo}-${idx}`}
                                        style={{
                                          fontSize: 11.5,
                                          padding: "7px 10px",
                                          background: "#ffffff",
                                          border: "1px solid #e2e8f0",
                                          borderRadius: 8,
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                          gap: 10,
                                          flexWrap: "wrap",
                                        }}
                                      >
                                        <div>
                                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <strong style={{ color: "#0f172a" }}>
                                              {r.name ? `${r.name} · ` : ""}{r.regNo}
                                            </strong>
                                            {r.branch && (
                                              <span style={{ fontSize: 10, color: "#64748b", background: "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>
                                                {r.branch} {r.section ? `(${r.section})` : ""}
                                              </span>
                                            )}
                                          </div>
                                          <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                                            <span style={{ color: r.actionTaken === "CHECK_NOW" ? "#2563eb" : "#7c3aed", fontWeight: 700 }}>
                                              {r.actionTaken === "CHECK_NOW" ? "Clicked Check Now" : "Clicked Understood"}
                                            </span>
                                            {r.device && <span>· {r.device}</span>}
                                          </div>
                                        </div>
                                        <span style={{ color: "#94a3b8", fontSize: 10.5, whiteSpace: "nowrap" }}>
                                          {r.readAt ? new Date(r.readAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "—"}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Dismissed Details */}
                              <div style={{ flex: 1, minWidth: 280 }}>
                                <div style={{ fontWeight: 700, fontSize: 12, color: "#7c3aed", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
                                  <Check size={14} color="#7c3aed" />
                                  <span>Students Dismissed ({b.dismissedDetails?.length || 0})</span>
                                </div>
                                {(!b.dismissedDetails || b.dismissedDetails.length === 0) ? (
                                  <div style={{ fontSize: 11.5, color: "#94a3b8", padding: "8px 0" }}>
                                    No students have dismissed this announcement yet.
                                  </div>
                                ) : (
                                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 240, overflowY: "auto" }}>
                                    {b.dismissedDetails.map((d, idx) => (
                                      <div
                                        key={`${d.regNo}-${idx}`}
                                        style={{
                                          fontSize: 11.5,
                                          padding: "7px 10px",
                                          background: "#ffffff",
                                          border: "1px solid #e2e8f0",
                                          borderRadius: 8,
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                          gap: 10,
                                          flexWrap: "wrap",
                                        }}
                                      >
                                        <div>
                                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <strong style={{ color: "#0f172a" }}>
                                              {d.name ? `${d.name} · ` : ""}{d.regNo}
                                            </strong>
                                            {d.branch && (
                                              <span style={{ fontSize: 10, color: "#64748b", background: "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>
                                                {d.branch} {d.section ? `(${d.section})` : ""}
                                              </span>
                                            )}
                                          </div>
                                          <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2 }}>
                                            <span style={{ color: "#7c3aed", fontWeight: 700 }}>Dismissed ("Understood")</span>
                                            {d.device && <span> · {d.device}</span>}
                                          </div>
                                        </div>
                                        <span style={{ color: "#94a3b8", fontSize: 10.5, whiteSpace: "nowrap" }}>
                                          {d.dismissedAt ? new Date(d.dismissedAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "—"}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
