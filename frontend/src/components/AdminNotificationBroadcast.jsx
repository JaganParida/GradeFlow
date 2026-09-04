import React, { useState, useEffect, useMemo } from "react";
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
  Radio,
  Info,
  Link2,
  Users,
  Loader2,
  ExternalLink,
  Smartphone,
  Monitor,
  Tablet,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  CheckCheck,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  UserCheck,
} from "lucide-react";

const CATEGORY_OPTIONS = [
  {
    id: "RESULT_ANNOUNCEMENT",
    label: "Results Published",
    badge: "Results",
    badgeColor: "blue",
    defaultRoute: "/leaderboard",
    defaultTitle: "Odd Semester Results Published!",
    defaultMessage: "Official semester results and section rank lists have been published. Check your score now.",
    defaultPrimary: "Check Now",
  },
  {
    id: "BROADCAST_ANNOUNCEMENT",
    label: "Important Notice",
    badge: "Important",
    badgeColor: "amber",
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
    defaultRoute: "/timetable",
    defaultTitle: "Updated Class Timetable Released",
    defaultMessage: "Class routines and lab schedules have been updated for all batches. View your new timetable.",
    defaultPrimary: "View Timetable",
  },
  {
    id: "FEATURE_EXPLORE",
    label: "Feature / Explore",
    badge: "New Feature",
    badgeColor: "green",
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

  // Inspector Drawer states
  const [expandedBroadcastId, setExpandedBroadcastId] = useState(null);
  const [drawerSubTab, setDrawerSubTab] = useState("READ"); // 'READ' | 'DISMISSED'
  const [studentSearch, setStudentSearch] = useState("");

  // History filtering
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilterCategory, setHistoryFilterCategory] = useState("ALL");

  useEffect(() => {
    fetchBroadcasts();
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      fetchBroadcasts(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchBroadcasts = async (silent = false) => {
    if (!silent) setHistoryLoading(true);
    try {
      const res = await axios.get(`${API}/admin/notifications/broadcasts`, authHeaders);
      if (res.data?.success) {
        setBroadcasts(res.data.broadcasts || []);
      }
    } catch {
      try {
        const res2 = await axios.get(`${API}/notifications?action=admin-broadcast-list`, authHeaders);
        if (res2.data?.success) {
          setBroadcasts(res2.data.broadcasts || []);
        }
      } catch {}
    } finally {
      if (!silent) setHistoryLoading(false);
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
      setFeedbackErr("Please fill in both the title and announcement message.");
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
        setFeedbackMsg(res.data.message || "Broadcast notification published to all students successfully!");
        fetchBroadcasts();
        setTimeout(() => setFeedbackMsg(""), 6000);
      } else {
        setFeedbackErr(res.data?.message || "Failed to publish broadcast announcement.");
      }
    } catch (err) {
      setFeedbackErr(err.response?.data?.message || "Error publishing broadcast notification.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBroadcast = async (notificationId) => {
    if (!window.confirm("Are you sure you want to delete this broadcast notification? It will be removed immediately from all student notification drawers.")) {
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
        if (expandedBroadcastId === notificationId) setExpandedBroadcastId(null);
        setFeedbackMsg("Broadcast announcement deleted successfully.");
        setTimeout(() => setFeedbackMsg(""), 5000);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete broadcast notification.");
    }
  };

  const renderCategoryIcon = (id, size = 16) => {
    switch (id) {
      case "RESULT_ANNOUNCEMENT":
        return <Trophy size={size} color="#2563eb" />;
      case "TIMETABLE_UPDATE":
        return <Calendar size={size} color="#7c3aed" />;
      case "FEATURE_EXPLORE":
        return <Compass size={size} color="#059669" />;
      case "URGENT_ALERT":
        return <AlertTriangle size={size} color="#dc2626" />;
      default:
        return <Megaphone size={size} color="#d97706" />;
    }
  };

  const renderDeviceIcon = (deviceStr, size = 12) => {
    const d = String(deviceStr || "").toLowerCase();
    if (d.includes("mobile") || d.includes("phone") || d.includes("android") || d.includes("iphone")) {
      return <Smartphone size={size} color="#2563eb" />;
    }
    if (d.includes("tablet") || d.includes("ipad")) {
      return <Tablet size={size} color="#7c3aed" />;
    }
    return <Monitor size={size} color="#475569" />;
  };

  const getBadgeVisual = (catBadge) => {
    const b = (catBadge || "").toLowerCase();
    if (b.includes("result")) return { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", text: "Results" };
    if (b.includes("schedule") || b.includes("timetable")) return { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe", text: "Schedule" };
    if (b.includes("feature")) return { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0", text: "Feature" };
    if (b.includes("urgent") || b.includes("alert")) return { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca", text: "Urgent" };
    return { bg: "#fffbeb", color: "#b45309", border: "#fde68a", text: "Notice" };
  };

  const formatFullDateTime = (dateStr) => {
    if (!dateStr) return "Just now";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Just now";
    const day = String(d.getDate()).padStart(2, "0");
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = String(hours).padStart(2, "0");
    return `${day} ${month} ${year} · ${hoursStr}:${minutes} ${ampm}`;
  };

  // Metrics
  const activeBroadcastCount = broadcasts.filter((b) => !b.expiresAt || new Date(b.expiresAt) > new Date()).length;
  const totalReadCount = broadcasts.reduce((sum, b) => sum + (b.readCount || 0), 0);
  const totalDismissedCount = broadcasts.reduce((sum, b) => sum + (b.dismissedCount || 0), 0);

  // Filtered broadcast history
  const filteredBroadcasts = useMemo(() => {
    return broadcasts.filter((b) => {
      const matchSearch =
        !historySearch.trim() ||
        b.title?.toLowerCase().includes(historySearch.toLowerCase()) ||
        b.message?.toLowerCase().includes(historySearch.toLowerCase()) ||
        b.badge?.toLowerCase().includes(historySearch.toLowerCase()) ||
        b.primaryButton?.targetRoute?.toLowerCase().includes(historySearch.toLowerCase());

      const matchCategory =
        historyFilterCategory === "ALL" || b.type === historyFilterCategory || b.badge === historyFilterCategory;

      return matchSearch && matchCategory;
    });
  }, [broadcasts, historySearch, historyFilterCategory]);

  const activeExpandedBroadcast = useMemo(() => {
    return broadcasts.find((b) => b.notificationId === expandedBroadcastId);
  }, [broadcasts, expandedBroadcastId]);

  const filteredReaderList = useMemo(() => {
    if (!activeExpandedBroadcast) return [];
    const source = drawerSubTab === "READ" ? (activeExpandedBroadcast.readDetails || []) : (activeExpandedBroadcast.dismissedDetails || []);
    if (!studentSearch.trim()) return source;
    const q = studentSearch.toLowerCase();
    return source.filter(
      (s) =>
        s.regNo?.toLowerCase().includes(q) ||
        s.name?.toLowerCase().includes(q) ||
        s.branch?.toLowerCase().includes(q)
    );
  }, [activeExpandedBroadcast, drawerSubTab, studentSearch]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Feedback Notification Toast ── */}
      <AnimatePresence>
        {feedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#065f46",
              borderRadius: 12,
              padding: "12px 16px",
              fontSize: 13,
              fontWeight: 650,
              display: "flex",
              alignItems: "center",
              gap: 10,
              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.12)",
            }}
          >
            <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0 }} />
            <span>{feedbackMsg}</span>
          </motion.div>
        )}

        {feedbackErr && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              borderRadius: 12,
              padding: "12px 16px",
              fontSize: 13,
              fontWeight: 650,
              display: "flex",
              alignItems: "center",
              gap: 10,
              boxShadow: "0 2px 8px rgba(239, 68, 68, 0.12)",
            }}
          >
            <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
            <span>{feedbackErr}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top Header Banner & 4-Card Executive KPI Grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: 12,
        }}
      >
        {/* Metric 1: Active Broadcasts */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: "16px 18px",
            boxShadow: "0 1px 4px rgba(15, 23, 42, 0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Active Broadcasts
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Radio size={16} color="#2563eb" />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.5px" }}>
            {activeBroadcastCount}
          </div>
          <div style={{ fontSize: 11.5, color: "#2563eb", fontWeight: 700, marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563eb" }} />
            Live in student bells
          </div>
        </div>

        {/* Metric 2: Total Student Reads */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: "16px 18px",
            boxShadow: "0 1px 4px rgba(15, 23, 42, 0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Student Reads
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCheck size={16} color="#059669" />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#059669", letterSpacing: "-0.5px" }}>
            {totalReadCount}
          </div>
          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 4 }}>
            Direct clicks & action views
          </div>
        </div>

        {/* Metric 3: Total Dismissed */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: "16px 18px",
            boxShadow: "0 1px 4px rgba(15, 23, 42, 0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Acknowledged
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check size={16} color="#7c3aed" />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#7c3aed", letterSpacing: "-0.5px" }}>
            {totalDismissedCount}
          </div>
          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 4 }}>
            Dismissed via "Understood"
          </div>
        </div>

        {/* Metric 4: Broadcast Delivery */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: "16px 18px",
            boxShadow: "0 1px 4px rgba(15, 23, 42, 0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Delivery Scope
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={16} color="#0284c7" />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#0284c7", letterSpacing: "-0.5px" }}>
            100%
          </div>
          <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 4 }}>
            All enrolled college batches
          </div>
        </div>
      </div>

      {/* ── Main 2-Column Grid: Announcement Composer + Live Student Preview ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.32fr) minmax(320px, 0.92fr)",
          gap: 18,
          alignItems: "start",
        }}
      >
        {/* ── Left Column: Compose Form ── */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 18,
            padding: isMobile ? "18px 16px" : "24px 26px",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Megaphone size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                  Compose Student Broadcast
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                  Publish push notification with action buttons to all active students
                </p>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 750, color: "#2563eb", background: "#dbeafe", padding: "2px 8px", borderRadius: 6 }}>
              Instant Sync
            </span>
          </div>

          <form onSubmit={handleSendBroadcast} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* 1. Category Selector Tiles */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
                Announcement Category
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
                  gap: 8,
                }}
              >
                {CATEGORY_OPTIONS.map((cat) => {
                  const isSelected = category.id === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: isSelected ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                        background: isSelected ? "#eff6ff" : "#ffffff",
                        color: isSelected ? "#1e40af" : "#475569",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        transition: "all 0.15s ease",
                        textAlign: "left",
                        boxShadow: isSelected ? "0 2px 6px rgba(37, 99, 235, 0.12)" : "none",
                      }}
                    >
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 7,
                          background: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {renderCategoryIcon(cat.id, 14)}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: isSelected ? 800 : 650, lineHeight: 1.2 }}>
                        {cat.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Notification Title */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Notification Title
                </label>
                <span style={{ fontSize: 11, color: title.length > 60 ? "#ea580c" : "#94a3b8" }}>
                  {title.length} / 80 chars
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Odd Semester Results Published!"
                maxLength={80}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1.5px solid #cbd5e1",
                  fontSize: 13.5,
                  fontWeight: 650,
                  color: "#0f172a",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border 0.2s ease",
                }}
              />
            </div>

            {/* 3. Notification Message */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Message Description
                </label>
                <span style={{ fontSize: 11, color: message.length > 220 ? "#ea580c" : "#94a3b8" }}>
                  {message.length} / 300 chars
                </span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write the announcement message that will appear in the notification body..."
                rows={3}
                maxLength={300}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1.5px solid #cbd5e1",
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: "#334155",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
            </div>

            {/* 4. Action Buttons Configuration Box */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 7 }}>
                <Link2 size={15} color="#2563eb" />
                <span>Action Buttons & Navigation Link</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                {/* Button 1 (Primary Action) */}
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 750, color: "#334155", marginBottom: 4 }}>
                    Primary CTA Label (Directs to Page):
                  </label>
                  <input
                    type="text"
                    value={primaryLabel}
                    onChange={(e) => setPrimaryLabel(e.target.value)}
                    placeholder="Check Now"
                    required
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1.5px solid #cbd5e1",
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: "#0f172a",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Button 2 (Secondary Action) */}
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 750, color: "#334155", marginBottom: 4 }}>
                    Secondary CTA Label (Dismiss):
                  </label>
                  <input
                    type="text"
                    value={secondaryLabel}
                    onChange={(e) => setSecondaryLabel(e.target.value)}
                    placeholder="Understood"
                    required
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1.5px solid #cbd5e1",
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: "#0f172a",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Target Page Selector */}
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 750, color: "#334155", marginBottom: 4 }}>
                  Redirect Destination for "{primaryLabel || "Check Now"}":
                </label>
                <select
                  value={targetRoute}
                  onChange={(e) => setTargetRoute(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 12.5,
                    fontWeight: 650,
                    background: "#ffffff",
                    color: "#0f172a",
                    boxSizing: "border-box",
                    cursor: "pointer",
                  }}
                >
                  {ROUTE_SHORTCUTS.map((r) => (
                    <option key={r.route} value={r.route}>
                      {r.label} ({r.route})
                    </option>
                  ))}
                  <option value="custom">Custom Internal Route or URL...</option>
                </select>

                {targetRoute === "custom" && (
                  <input
                    type="text"
                    value={customRoute}
                    onChange={(e) => setCustomRoute(e.target.value)}
                    placeholder="/custom-route or https://..."
                    style={{
                      width: "100%",
                      marginTop: 8,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1.5px solid #2563eb",
                      fontSize: 12.5,
                      boxSizing: "border-box",
                    }}
                  />
                )}
              </div>
            </div>

            {/* 5. Expiration & Publish Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
                borderTop: "1px solid #f1f5f9",
                paddingTop: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Clock size={15} color="#64748b" />
                <span style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>Expires:</span>
                <select
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(e.target.value)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 7,
                    border: "1px solid #cbd5e1",
                    fontSize: 12,
                    fontWeight: 600,
                    background: "#ffffff",
                    cursor: "pointer",
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
                  padding: "10px 22px",
                  borderRadius: 10,
                  border: "none",
                  background: loading ? "#94a3b8" : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 750,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
                  transition: "all 0.15s ease",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    <span>Broadcasting...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Publish Broadcast</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ── Right Column: Live Student Notification Preview ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 18,
              padding: "20px 22px",
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Eye size={16} color="#2563eb" />
                <span style={{ fontWeight: 800, fontSize: 13.5, color: "#0f172a" }}>
                  Live Student View Preview
                </span>
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: "#059669",
                  fontWeight: 750,
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  padding: "2px 8px",
                  borderRadius: 99,
                }}
              >
                Interactive Mockup
              </span>
            </div>

            {/* Notification Card Simulator */}
            <div
              style={{
                background: "#f8faff",
                border: "1.5px solid #bfdbfe",
                borderRadius: 14,
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.08)",
              }}
            >
              {/* Header inside card */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    background:
                      category.badgeColor === "blue"
                        ? "#eff6ff"
                        : category.badgeColor === "green"
                        ? "#ecfdf5"
                        : category.badgeColor === "purple"
                        ? "#f5f3ff"
                        : category.badgeColor === "red"
                        ? "#fef2f2"
                        : "#fffbeb",
                    border: "1px solid #dbeafe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {renderCategoryIcon(category.id, 18)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>
                        {title || "Announcement Title"}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "1px 6px",
                          borderRadius: 5,
                          background: "#eff6ff",
                          color: "#2563eb",
                          border: "1px solid #dbeafe",
                          textTransform: "uppercase",
                          letterSpacing: "0.4px",
                        }}
                      >
                        {category.badge}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>Just now</span>
                  </div>

                  <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.45, marginTop: 4 }}>
                    {message || "Message description will display here..."}
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 8,
                  paddingTop: 10,
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                <button
                  type="button"
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    color: "#475569",
                    fontSize: 12,
                    fontWeight: 700,
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
                    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                    border: "none",
                    color: "#ffffff",
                    fontSize: 12,
                    fontWeight: 750,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    boxShadow: "0 2px 6px rgba(37, 99, 235, 0.2)",
                    cursor: "default",
                  }}
                >
                  <span>{primaryLabel || "Check Now"}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>

            {/* Mechanics Explanation */}
            <div style={{ marginTop: 14, fontSize: 11.5, color: "#64748b", lineHeight: 1.45, display: "flex", alignItems: "flex-start", gap: 7 }}>
              <Info size={15} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Action Flow:</strong> When a student clicks <strong>"{primaryLabel || "Check Now"}"</strong>, GradeFlow records their read acknowledgment in real time and automatically redirects them to <code>{targetRoute === "custom" ? customRoute || "/..." : targetRoute}</code>. Clicking <strong>"{secondaryLabel || "Understood"}"</strong> acknowledges the notice without navigating.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Broadcast History & Student Engagement Section ── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 18,
          padding: isMobile ? "18px 16px" : "22px 24px",
          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)",
        }}
      >
        {/* Table & Filter Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: "space-between",
            flexDirection: isMobile ? "column" : "row",
            gap: 12,
            marginBottom: 16,
            borderBottom: "1px solid #f1f5f9",
            paddingBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Clock size={16} color="#0f172a" />
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
              Active & Sent Broadcasts ({filteredBroadcasts.length})
            </h3>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: isMobile ? "100%" : "auto" }}>
            {/* Search Input */}
            <div style={{ position: "relative", flex: isMobile ? 1 : "initial", minWidth: isMobile ? "100%" : 200 }}>
              <Search size={14} color="#94a3b8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search announcements..."
                style={{
                  width: "100%",
                  padding: "6px 10px 6px 30px",
                  borderRadius: 8,
                  border: "1.5px solid #cbd5e1",
                  fontSize: 12,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Category Filter */}
            <select
              value={historyFilterCategory}
              onChange={(e) => setHistoryFilterCategory(e.target.value)}
              style={{
                flex: isMobile ? 1 : "initial",
                padding: "6px 10px",
                borderRadius: 8,
                border: "1.5px solid #cbd5e1",
                fontSize: 12,
                fontWeight: 650,
                background: "#ffffff",
                cursor: "pointer",
              }}
            >
              <option value="ALL">All Categories</option>
              <option value="RESULT_ANNOUNCEMENT">Results</option>
              <option value="BROADCAST_ANNOUNCEMENT">Important Notice</option>
              <option value="TIMETABLE_UPDATE">Schedule</option>
              <option value="FEATURE_EXPLORE">Feature</option>
              <option value="URGENT_ALERT">Urgent</option>
            </select>

            <button
              type="button"
              onClick={() => fetchBroadcasts()}
              disabled={historyLoading}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                fontSize: 12,
                fontWeight: 700,
                color: "#334155",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <RefreshCw size={13} className={historyLoading ? "spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Empty State */}
        {filteredBroadcasts.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#f1f5f9", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <Megaphone size={20} color="#94a3b8" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 750, color: "#334155" }}>
              No broadcast notifications found
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
              {historySearch || historyFilterCategory !== "ALL"
                ? "No broadcasts match your active filters. Try clearing the search."
                : "Compose and broadcast your first student announcement above!"}
            </div>
          </div>
        ) : isMobile ? (
          /* Mobile Card View (Zero Horizontal Scrolling) */
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredBroadcasts.map((b) => {
              const isExpired = b.expiresAt && new Date(b.expiresAt) <= new Date();
              const badgeVisual = getBadgeVisual(b.badge);
              const isExpanded = expandedBroadcastId === b.notificationId;

              return (
                <div
                  key={b.notificationId}
                  style={{
                    background: isExpanded ? "#f8faff" : "#ffffff",
                    border: isExpanded ? "1.5px solid #93c5fd" : "1px solid #e2e8f0",
                    borderRadius: 14,
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.02)",
                  }}
                >
                  {/* Top Bar: Icon + Badge + Date */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          padding: "2px 7px",
                          borderRadius: 6,
                          background: badgeVisual.bg,
                          color: badgeVisual.color,
                          border: `1px solid ${badgeVisual.border}`,
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}
                      >
                        {b.badge || "Notice"}
                      </span>
                      {isExpired && (
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#dc2626", background: "#fee2e2", padding: "1px 6px", borderRadius: 4 }}>
                          Expired
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
                      {formatFullDateTime(b.createdAt)}
                    </span>
                  </div>

                  {/* Title & Message */}
                  <div>
                    <strong style={{ fontSize: 14, color: "#0f172a", display: "block" }}>{b.title}</strong>
                    <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#475569", lineHeight: 1.45 }}>
                      {b.message}
                    </p>
                  </div>

                  {/* Target Route Pill */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Target:</span>
                    <span style={{ background: "#f1f5f9", padding: "2px 7px", borderRadius: 6, fontSize: 11.5, color: "#2563eb", fontFamily: "monospace", fontWeight: 700 }}>
                      {b.primaryButton?.targetRoute || "/dashboard"}
                    </span>
                  </div>

                  {/* Read / Dismiss / Delete Interaction Bar */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      paddingTop: 10,
                      borderTop: "1px solid #f1f5f9",
                    }}
                  >
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedBroadcastId(isExpanded ? null : b.notificationId);
                          setDrawerSubTab("READ");
                        }}
                        style={{
                          padding: "5px 9px",
                          borderRadius: 7,
                          background: isExpanded && drawerSubTab === "READ" ? "#ecfdf5" : "#f8fafc",
                          border: `1px solid ${isExpanded && drawerSubTab === "READ" ? "#a7f3d0" : "#e2e8f0"}`,
                          fontSize: 11.5,
                          fontWeight: 750,
                          color: "#059669",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <CheckCircle2 size={13} />
                        <span>Reads: {b.readCount || 0}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setExpandedBroadcastId(isExpanded ? null : b.notificationId);
                          setDrawerSubTab("DISMISSED");
                        }}
                        style={{
                          padding: "5px 9px",
                          borderRadius: 7,
                          background: isExpanded && drawerSubTab === "DISMISSED" ? "#f5f3ff" : "#f8fafc",
                          border: `1px solid ${isExpanded && drawerSubTab === "DISMISSED" ? "#ddd6fe" : "#e2e8f0"}`,
                          fontSize: 11.5,
                          fontWeight: 750,
                          color: "#7c3aed",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Check size={13} />
                        <span>Dismissed: {b.dismissedCount || 0}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteBroadcast(b.notificationId)}
                      style={{
                        padding: "5px 9px",
                        borderRadius: 7,
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        color: "#dc2626",
                        fontSize: 11.5,
                        fontWeight: 750,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>

                  {/* Expanded Student List in Mobile */}
                  {isExpanded && (
                    <div style={{ marginTop: 8, paddingTop: 10, borderTop: "1px dashed #cbd5e1" }}>
                      {/* Subtab Toggle */}
                      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                        <button
                          type="button"
                          onClick={() => setDrawerSubTab("READ")}
                          style={{
                            flex: 1,
                            padding: "6px 8px",
                            borderRadius: 6,
                            border: "none",
                            background: drawerSubTab === "READ" ? "#059669" : "#f1f5f9",
                            color: drawerSubTab === "READ" ? "#ffffff" : "#475569",
                            fontSize: 11.5,
                            fontWeight: 750,
                            cursor: "pointer",
                          }}
                        >
                          Interacted ({b.readDetails?.length || 0})
                        </button>
                        <button
                          type="button"
                          onClick={() => setDrawerSubTab("DISMISSED")}
                          style={{
                            flex: 1,
                            padding: "6px 8px",
                            borderRadius: 6,
                            border: "none",
                            background: drawerSubTab === "DISMISSED" ? "#7c3aed" : "#f1f5f9",
                            color: drawerSubTab === "DISMISSED" ? "#ffffff" : "#475569",
                            fontSize: 11.5,
                            fontWeight: 750,
                            cursor: "pointer",
                          }}
                        >
                          Dismissed ({b.dismissedDetails?.length || 0})
                        </button>
                      </div>

                      {/* Search in Drawer */}
                      <input
                        type="text"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        placeholder="Search student or roll no..."
                        style={{
                          width: "100%",
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "1px solid #cbd5e1",
                          fontSize: 11.5,
                          marginBottom: 8,
                          boxSizing: "border-box",
                        }}
                      />

                      {/* List */}
                      {filteredReaderList.length === 0 ? (
                        <div style={{ padding: "14px", textAlign: "center", fontSize: 11.5, color: "#94a3b8" }}>
                          No students in this list.
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
                          {filteredReaderList.map((st, idx) => (
                            <div
                              key={`${st.regNo}-${idx}`}
                              style={{
                                background: "#ffffff",
                                border: "1px solid #e2e8f0",
                                borderRadius: 8,
                                padding: "7px 10px",
                                fontSize: 11.5,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 800, color: "#0f172a" }}>
                                  {st.name ? `${st.name} · ` : ""}{st.regNo}
                                </div>
                                <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>
                                  {renderDeviceIcon(st.device, 11)}
                                  <span>{st.device || "Unknown Device"}</span>
                                </div>
                              </div>
                              <span style={{ fontSize: 10, color: "#94a3b8" }}>
                                {formatFullDateTime(st.readAt || st.dismissedAt)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Desktop Table View */
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0", color: "#64748b", fontSize: 11.5, textTransform: "uppercase" }}>
                  <th style={{ padding: "11px 14px" }}>Announcement & Category</th>
                  <th style={{ padding: "11px 14px" }}>Target Page Route</th>
                  <th style={{ padding: "11px 14px" }}>Sent Date</th>
                  <th style={{ padding: "11px 14px" }}>Reads / Clicks</th>
                  <th style={{ padding: "11px 14px" }}>Dismissed</th>
                  <th style={{ padding: "11px 14px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBroadcasts.map((b) => {
                  const isExpired = b.expiresAt && new Date(b.expiresAt) <= new Date();
                  const badgeVisual = getBadgeVisual(b.badge);
                  const isExpanded = expandedBroadcastId === b.notificationId;

                  return (
                    <React.Fragment key={b.notificationId}>
                      <tr
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          background: isExpanded ? "#f8faff" : "transparent",
                          transition: "background 0.15s ease",
                        }}
                      >
                        {/* Title & Badge */}
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                background: badgeVisual.bg,
                                border: `1px solid ${badgeVisual.border}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {renderCategoryIcon(b.type, 15)}
                            </div>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <strong style={{ color: "#0f172a", fontSize: 13 }}>{b.title}</strong>
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 800,
                                    padding: "1px 6px",
                                    borderRadius: 4,
                                    background: badgeVisual.bg,
                                    color: badgeVisual.color,
                                    border: `1px solid ${badgeVisual.border}`,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.3px",
                                  }}
                                >
                                  {b.badge || "Notice"}
                                </span>
                              </div>
                              <div style={{ fontSize: 11.5, color: "#64748b", maxWidth: 300, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", marginTop: 2 }}>
                                {b.message}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Target Route */}
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", padding: "3px 8px", borderRadius: 6, fontSize: 11.5, color: "#2563eb", fontFamily: "monospace", fontWeight: 700 }}>
                            {b.primaryButton?.targetRoute || "/dashboard"}
                          </span>
                        </td>

                        {/* Sent Date */}
                        <td style={{ padding: "12px 14px", color: "#64748b", fontSize: 12 }}>
                          <div>{formatFullDateTime(b.createdAt)}</div>
                          {isExpired ? (
                            <span style={{ color: "#dc2626", fontWeight: 750, fontSize: 10.5 }}>Expired</span>
                          ) : (
                            <span style={{ color: "#059669", fontWeight: 750, fontSize: 10.5 }}>Active</span>
                          )}
                        </td>

                        {/* Reads Pill */}
                        <td style={{ padding: "12px 14px" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedBroadcastId(isExpanded && drawerSubTab === "READ" ? null : b.notificationId);
                              setDrawerSubTab("READ");
                            }}
                            style={{
                              padding: "4px 10px",
                              borderRadius: 7,
                              background: isExpanded && drawerSubTab === "READ" ? "#ecfdf5" : "#f8fafc",
                              border: `1px solid ${isExpanded && drawerSubTab === "READ" ? "#a7f3d0" : "#e2e8f0"}`,
                              fontSize: 12,
                              fontWeight: 750,
                              color: "#059669",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              transition: "all 0.15s ease",
                            }}
                            title="Inspect students who read / clicked this"
                          >
                            <CheckCircle2 size={13} />
                            <span>{b.readCount || 0} students</span>
                            <Eye size={12} color="#059669" />
                          </button>
                        </td>

                        {/* Dismissed Pill */}
                        <td style={{ padding: "12px 14px" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setExpandedBroadcastId(isExpanded && drawerSubTab === "DISMISSED" ? null : b.notificationId);
                              setDrawerSubTab("DISMISSED");
                            }}
                            style={{
                              padding: "4px 10px",
                              borderRadius: 7,
                              background: isExpanded && drawerSubTab === "DISMISSED" ? "#f5f3ff" : "#f8fafc",
                              border: `1px solid ${isExpanded && drawerSubTab === "DISMISSED" ? "#ddd6fe" : "#e2e8f0"}`,
                              fontSize: 12,
                              fontWeight: 750,
                              color: "#7c3aed",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              transition: "all 0.15s ease",
                            }}
                            title="Inspect students who clicked Understood"
                          >
                            <Check size={13} />
                            <span>{b.dismissedCount || 0} students</span>
                            <Eye size={12} color="#7c3aed" />
                          </button>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "12px 14px", textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={() => handleDeleteBroadcast(b.notificationId)}
                            style={{
                              padding: "5px 10px",
                              borderRadius: 7,
                              background: "#fef2f2",
                              border: "1px solid #fecaca",
                              color: "#dc2626",
                              fontSize: 11.5,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                            title="Delete this broadcast notice"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>

                      {/* Desktop Expandable Drawer */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} style={{ padding: "0 14px 16px 14px", background: "#f8fafc" }}>
                            <div
                              style={{
                                background: "#ffffff",
                                border: "1px solid #e2e8f0",
                                borderRadius: 12,
                                padding: "14px 16px",
                                marginTop: 8,
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                                <div style={{ display: "flex", gap: 8 }}>
                                  <button
                                    type="button"
                                    onClick={() => setDrawerSubTab("READ")}
                                    style={{
                                      padding: "6px 14px",
                                      borderRadius: 7,
                                      border: "none",
                                      background: drawerSubTab === "READ" ? "#059669" : "#f1f5f9",
                                      color: drawerSubTab === "READ" ? "#ffffff" : "#475569",
                                      fontSize: 12,
                                      fontWeight: 750,
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 6,
                                    }}
                                  >
                                    <CheckCircle2 size={13} />
                                    <span>Students Read & Clicked ({b.readDetails?.length || 0})</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setDrawerSubTab("DISMISSED")}
                                    style={{
                                      padding: "6px 14px",
                                      borderRadius: 7,
                                      border: "none",
                                      background: drawerSubTab === "DISMISSED" ? "#7c3aed" : "#f1f5f9",
                                      color: drawerSubTab === "DISMISSED" ? "#ffffff" : "#475569",
                                      fontSize: 12,
                                      fontWeight: 750,
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 6,
                                    }}
                                  >
                                    <Check size={13} />
                                    <span>Students Dismissed ({b.dismissedDetails?.length || 0})</span>
                                  </button>
                                </div>

                                <div style={{ position: "relative", minWidth: 200 }}>
                                  <Search size={13} color="#94a3b8" style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)" }} />
                                  <input
                                    type="text"
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                    placeholder="Search by student or roll..."
                                    style={{
                                      width: "100%",
                                      padding: "5px 8px 5px 28px",
                                      borderRadius: 6,
                                      border: "1px solid #cbd5e1",
                                      fontSize: 11.5,
                                      boxSizing: "border-box",
                                    }}
                                  />
                                </div>
                              </div>

                              {filteredReaderList.length === 0 ? (
                                <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: 12 }}>
                                  No student interactions recorded in this category yet.
                                </div>
                              ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8, maxHeight: 240, overflowY: "auto" }}>
                                  {filteredReaderList.map((st, idx) => (
                                    <div
                                      key={`${st.regNo}-${idx}`}
                                      style={{
                                        padding: "8px 12px",
                                        borderRadius: 8,
                                        border: "1px solid #e2e8f0",
                                        background: "#fafafa",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                      }}
                                    >
                                      <div>
                                        <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 12 }}>
                                          {st.name ? `${st.name} · ` : ""}{st.regNo}
                                        </div>
                                        <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>
                                          {renderDeviceIcon(st.device, 11)}
                                          <span>{st.device || "Unknown Device"}</span>
                                          {st.branch && <span>· {st.branch}</span>}
                                        </div>
                                      </div>
                                      <span style={{ fontSize: 10.5, color: "#94a3b8" }}>
                                        {formatFullDateTime(st.readAt || st.dismissedAt)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
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
