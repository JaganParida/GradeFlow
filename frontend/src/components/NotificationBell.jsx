import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import {
  Bell,
  Check,
  X,
  Smartphone,
  Laptop,
  Tablet,
  ShieldAlert,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trophy,
  Megaphone,
  Calendar,
  Compass,
  ArrowRight,
  ExternalLink,
  CheckCheck,
  Sparkles,
} from "lucide-react";

export default function NotificationBell({ isMobile = false }) {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    approveLoginRequest,
    denyLoginRequest,
    markNotificationsRead,
    handleNotificationAction,
    hasActiveSession,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [processingState, setProcessingState] = useState({}); // { [notifId]: 'ALLOW' | 'DENY' | 'ACTION' }
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen]);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && unreadCount > 0) {
      markNotificationsRead();
    }
  };

  const handleApprove = async (e, notif) => {
    e.stopPropagation();
    if (!notif.approvalRequestId || processingState[notif.notificationId]) return;
    setProcessingState((prev) => ({ ...prev, [notif.notificationId]: "ALLOW" }));
    try {
      await approveLoginRequest(notif.approvalRequestId);
    } finally {
      setProcessingState((prev) => ({ ...prev, [notif.notificationId]: null }));
    }
  };

  const handleDeny = async (e, notif) => {
    e.stopPropagation();
    if (!notif.approvalRequestId || processingState[notif.notificationId]) return;
    setProcessingState((prev) => ({ ...prev, [notif.notificationId]: "DENY" }));
    try {
      await denyLoginRequest(notif.approvalRequestId);
    } finally {
      setProcessingState((prev) => ({ ...prev, [notif.notificationId]: null }));
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "Just now";
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const handleCheckNow = async (e, notif) => {
    e.stopPropagation();
    if (processingState[notif.notificationId]) return;
    setProcessingState((prev) => ({ ...prev, [notif.notificationId]: "CHECK_NOW" }));
    try {
      if (handleNotificationAction) {
        await handleNotificationAction(notif.notificationId, "CHECK_NOW");
      }
      setIsOpen(false);
      const targetRoute = notif.primaryButton?.targetRoute;
      if (targetRoute) {
        if (targetRoute.startsWith("http://") || targetRoute.startsWith("https://")) {
          window.open(targetRoute, "_blank", "noopener,noreferrer");
        } else {
          navigate(targetRoute);
        }
      }
    } finally {
      setProcessingState((prev) => ({ ...prev, [notif.notificationId]: null }));
    }
  };

  const handleUnderstood = async (e, notif) => {
    e.stopPropagation();
    if (processingState[notif.notificationId]) return;
    setProcessingState((prev) => ({ ...prev, [notif.notificationId]: "UNDERSTOOD" }));
    try {
      if (handleNotificationAction) {
        await handleNotificationAction(notif.notificationId, "UNDERSTOOD");
      }
    } finally {
      setProcessingState((prev) => ({ ...prev, [notif.notificationId]: null }));
    }
  };

  const getDeviceIcon = (deviceType) => {
    const clean = String(deviceType || "").toLowerCase();
    if (clean.includes("mobile") || clean.includes("phone")) {
      return <Smartphone size={16} color="#2563eb" />;
    }
    if (clean.includes("tablet") || clean.includes("ipad")) {
      return <Tablet size={16} color="#2563eb" />;
    }
    return <Laptop size={16} color="#2563eb" />;
  };

  const getNotificationIcon = (notif) => {
    const type = notif.type || "";
    const badge = (notif.badge || "").toLowerCase();
    if (type === "LOGIN_APPROVAL_REQUEST") {
      return getDeviceIcon(notif.requestingDevice?.deviceType);
    }
    if (type === "RESULT_ANNOUNCEMENT" || badge.includes("result")) {
      return <Trophy size={16} color="#2563eb" />;
    }
    if (type === "TIMETABLE_UPDATE" || badge.includes("timetable") || badge.includes("schedule")) {
      return <Calendar size={16} color="#7c3aed" />;
    }
    if (type === "FEATURE_EXPLORE" || badge.includes("explore") || badge.includes("feature")) {
      return <Compass size={16} color="#059669" />;
    }
    if (type === "URGENT_ALERT" || type === "SYSTEM_ALERT" || badge.includes("alert")) {
      return <AlertTriangle size={16} color="#dc2626" />;
    }
    return <Megaphone size={16} color="#2563eb" />;
  };

  const getBadgeStyle = (notif) => {
    const type = notif.type || "";
    const badge = (notif.badge || "").toLowerCase();
    if (type === "RESULT_ANNOUNCEMENT" || badge.includes("result")) {
      return { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" };
    }
    if (type === "TIMETABLE_UPDATE" || badge.includes("timetable") || badge.includes("schedule")) {
      return { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" };
    }
    if (type === "FEATURE_EXPLORE" || badge.includes("explore") || badge.includes("feature")) {
      return { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" };
    }
    if (type === "URGENT_ALERT" || type === "SYSTEM_ALERT" || badge.includes("alert")) {
      return { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" };
    }
    return { bg: "#fffbeb", color: "#b45309", border: "#fde68a" };
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        title="Notifications & Device Approvals"
        style={{
          position: "relative",
          width: isMobile ? 36 : 38,
          height: isMobile ? 36 : 38,
          borderRadius: 10,
          border: isOpen ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
          background: isOpen ? "#eff6ff" : "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: isOpen ? "#2563eb" : "#475569",
          cursor: "pointer",
          transition: "all 0.18s ease",
          padding: 0,
        }}
      >
        <Bell size={18} />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "#dc2626",
              color: "#ffffff",
              fontSize: 10.5,
              fontWeight: 800,
              minWidth: 18,
              height: 18,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              boxShadow: "0 2px 5px rgba(220, 38, 38, 0.4)",
              border: "2px solid #ffffff",
              fontFamily: "'Space Mono', monospace",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Hanging Dropdown / Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            style={{
              position: isMobile ? "fixed" : "absolute",
              top: isMobile ? 64 : "calc(100% + 10px)",
              right: isMobile ? 12 : 0,
              left: isMobile ? 12 : "auto",
              width: isMobile ? "calc(100vw - 24px)" : "min(360px, calc(100vw - 24px))",
              maxWidth: "calc(100vw - 24px)",
              maxHeight: "min(80vh, 520px)",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              background: "#ffffff",
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              boxShadow: "0 18px 40px -10px rgba(15, 23, 42, 0.22)",
              zIndex: 99999,
              padding: "16px 14px",
              boxSizing: "border-box",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: 12,
                borderBottom: "1px solid #f1f5f9",
                marginBottom: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    background: "#eff6ff",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Bell size={14} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span
                    style={{
                      background: "#fee2e2",
                      color: "#991b1b",
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: "2px 7px",
                      borderRadius: 99,
                    }}
                  >
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markNotificationsRead}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#2563eb",
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: "3px 6px",
                      borderRadius: 6,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                    title="Mark all notifications as read"
                  >
                    <CheckCheck size={13} />
                    <span>Read all</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: 3,
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* List of Notifications */}
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: "36px 16px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircle2 size={24} color="#94a3b8" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: "#1e293b", fontSize: 13.5 }}>
                    You're all caught up!
                  </div>
                  <div style={{ color: "#64748b", fontSize: 12, marginTop: 3 }}>
                    No active announcements or notifications right now.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {notifications.map((notif) => {
                  const currentAction = processingState[notif.notificationId];
                  const isProcessing = Boolean(currentAction);
                  const isUnread = !notif.isRead && notif.status !== "APPROVED" && notif.status !== "DENIED" && notif.status !== "EXPIRED";
                  const isApproved = notif.status === "APPROVED";
                  const isDenied = notif.status === "DENIED";
                  const isExpired = notif.status === "EXPIRED";
                  const badgeStyle = getBadgeStyle(notif);

                  return (
                    <div
                      key={notif.notificationId}
                      style={{
                        background: isUnread ? "#f8faff" : "#ffffff",
                        border: isUnread ? "1.5px solid #bfdbfe" : "1px solid #e2e8f0",
                        borderRadius: 12,
                        padding: "12px 14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        transition: "all 0.15s ease",
                      }}
                    >
                      {/* Top Row: Icon + Title + Time + Badge */}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            background: badgeStyle.bg,
                            border: `1px solid ${badgeStyle.border}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            marginTop: 1,
                          }}
                        >
                          {getNotificationIcon(notif)}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 6,
                              flexWrap: "wrap",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 800,
                                  color: "#0f172a",
                                }}
                              >
                                {notif.title || "Announcement"}
                              </span>

                              {notif.badge && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: "1px 6px",
                                    borderRadius: 5,
                                    background: badgeStyle.bg,
                                    color: badgeStyle.color,
                                    border: `1px solid ${badgeStyle.border}`,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.3px",
                                  }}
                                >
                                  {notif.badge}
                                </span>
                              )}
                            </div>

                            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, whiteSpace: "nowrap" }}>
                              {formatTimeAgo(notif.createdAt)}
                            </span>
                          </div>

                          {/* Message Body */}
                          <div
                            style={{
                              fontSize: 12.5,
                              color: "#475569",
                              lineHeight: 1.45,
                              marginTop: 4,
                            }}
                          >
                            {notif.message}
                          </div>

                          {/* Device Metadata Card for login approval requests */}
                          {notif.requestingDevice && notif.type === "LOGIN_APPROVAL_REQUEST" && (
                            <div
                              style={{
                                marginTop: 6,
                                background: "#ffffff",
                                border: "1px solid #e2e8f0",
                                borderRadius: 8,
                                padding: "6px 8px",
                                fontSize: 11.5,
                                color: "#334155",
                                lineHeight: 1.4,
                              }}
                            >
                              <div>
                                <strong>Device:</strong>{" "}
                                {notif.requestingDevice.deviceType || "Desktop"}
                              </div>
                              <div>
                                <strong>Platform:</strong>{" "}
                                {notif.requestingDevice.platform ||
                                  `${notif.requestingDevice.os} / ${notif.requestingDevice.browser}`}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* TWO ACTION BUTTONS FOR BROADCASTS & ANNOUNCEMENTS */}
                      {notif.type !== "LOGIN_APPROVAL_REQUEST" && (
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
                          {/* Button 2: Understood / Dismiss */}
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={(e) => handleUnderstood(e, notif)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 8,
                              background: "#ffffff",
                              border: "1px solid #e2e8f0",
                              color: "#64748b",
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: isProcessing ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              transition: "all 0.15s ease",
                            }}
                          >
                            {currentAction === "UNDERSTOOD" ? (
                              <Loader2 size={12} className="spin" />
                            ) : (
                              <Check size={13} />
                            )}
                            <span>{notif.secondaryButton?.label || "Understood"}</span>
                          </button>

                          {/* Button 1: Check Now / Navigate */}
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={(e) => handleCheckNow(e, notif)}
                            style={{
                              padding: "6px 14px",
                              borderRadius: 8,
                              background: "#2563eb",
                              border: "none",
                              color: "#ffffff",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: isProcessing ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              boxShadow: "0 2px 6px rgba(37, 99, 235, 0.22)",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <span>{notif.primaryButton?.label || "Check Now"}</span>
                            {notif.primaryButton?.targetRoute?.startsWith("http") ? (
                              <ExternalLink size={12} />
                            ) : (
                              <ArrowRight size={13} />
                            )}
                          </button>
                        </div>
                      )}

                      {/* Action Buttons for Device Approvals */}
                      {isUnread && notif.type === "LOGIN_APPROVAL_REQUEST" && (
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            marginTop: 4,
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={(e) => handleDeny(e, notif)}
                            style={{
                              padding: "7px 12px",
                              minHeight: 36,
                              borderRadius: 8,
                              border: "1px solid #fca5a5",
                              background: currentAction === "DENY" ? "#fee2e2" : "#fef2f2",
                              color: "#991b1b",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: isProcessing ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            {currentAction === "DENY" ? (
                              <>
                                <Loader2 size={13} className="spin" />
                                <span>Denying...</span>
                              </>
                            ) : (
                              <>
                                <X size={13} />
                                <span>Deny</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={(e) => handleApprove(e, notif)}
                            style={{
                              padding: "7px 14px",
                              minHeight: 36,
                              borderRadius: 8,
                              border: "none",
                              background: currentAction === "ALLOW" ? "#15803d" : isProcessing ? "#94a3b8" : "#16a34a",
                              color: "#ffffff",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: isProcessing ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              boxShadow: "0 2px 4px rgba(22, 163, 74, 0.2)",
                            }}
                          >
                            {currentAction === "ALLOW" ? (
                              <>
                                <Loader2 size={13} className="spin" />
                                <span>Approving...</span>
                              </>
                            ) : (
                              <>
                                <Check size={13} />
                                <span>Allow This Device</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Status Badges for Already-Responded Requests */}
                      {isApproved && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#16a34a",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            marginTop: 2,
                            padding: "4px 8px",
                            background: "#f0fdf4",
                            borderRadius: 6,
                          }}
                        >
                          <CheckCircle2 size={14} color="#16a34a" />
                          <span>Device access approved</span>
                        </div>
                      )}

                      {isDenied && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#dc2626",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            marginTop: 2,
                            padding: "4px 8px",
                            background: "#fef2f2",
                            borderRadius: 6,
                          }}
                        >
                          <XCircle size={14} color="#dc2626" />
                          <span>Login request denied</span>
                        </div>
                      )}

                      {isExpired && (
                        <div
                          style={{
                            fontSize: 11.5,
                            color: "#64748b",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            marginTop: 2,
                          }}
                        >
                          <Clock size={13} />
                          <span>Request expired</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
