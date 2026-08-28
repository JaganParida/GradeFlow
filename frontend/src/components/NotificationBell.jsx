import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";

export default function NotificationBell({ isMobile = false }) {
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    approveLoginRequest,
    denyLoginRequest,
    markNotificationsRead,
    hasActiveSession,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);
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

  if (!hasActiveSession) {
    return null;
  }

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && unreadCount > 0) {
      markNotificationsRead();
    }
  };

  const handleApprove = async (e, notif) => {
    e.stopPropagation();
    if (!notif.approvalRequestId || processingId) return;
    setProcessingId(notif.notificationId);
    try {
      await approveLoginRequest(notif.approvalRequestId);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeny = async (e, notif) => {
    e.stopPropagation();
    if (!notif.approvalRequestId || processingId) return;
    setProcessingId(notif.notificationId);
    try {
      await denyLoginRequest(notif.approvalRequestId);
    } finally {
      setProcessingId(null);
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
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Bell size={15} color="#0f172a" />
                <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span
                    style={{
                      background: "#fee2e2",
                      color: "#991b1b",
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "2px 7px",
                      borderRadius: 10,
                    }}
                  >
                    {unreadCount} new
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: 2,
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* List of Notifications */}
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "#94a3b8",
                  fontSize: 13,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <CheckCircle2 size={28} color="#cbd5e1" />
                <span>You're all caught up! No active notifications.</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {notifications.map((notif) => {
                  const isProcessing = processingId === notif.notificationId;
                  const isPending = notif.status === "UNREAD" || notif.status === "READ";
                  const isApproved = notif.status === "APPROVED";
                  const isDenied = notif.status === "DENIED";
                  const isExpired = notif.status === "EXPIRED";

                  return (
                    <div
                      key={notif.notificationId}
                      style={{
                        background: isPending ? "#f8fafc" : "#ffffff",
                        border: isPending ? "1.5px solid #dbeafe" : "1px solid #f1f5f9",
                        borderRadius: 12,
                        padding: "12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        transition: "all 0.15s ease",
                      }}
                    >
                      {/* Top Row: Icon + Title + Time */}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: isPending ? "#eff6ff" : "#f1f5f9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {getDeviceIcon(notif.requestingDevice?.deviceType)}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 800,
                                color: "#0f172a",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              {notif.title || "New Login Request"}
                            </span>
                            <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
                              {formatTimeAgo(notif.createdAt)}
                            </span>
                          </div>

                          {/* Device Metadata Card */}
                          {notif.requestingDevice && (
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

                      {/* Action Buttons if Pending */}
                      {isPending && notif.type === "LOGIN_APPROVAL_REQUEST" && (
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
                              padding: "6px 12px",
                              borderRadius: 8,
                              border: "1px solid #fca5a5",
                              background: "#fef2f2",
                              color: "#991b1b",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: isProcessing ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <X size={13} />
                            <span>Deny</span>
                          </button>

                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={(e) => handleApprove(e, notif)}
                            style={{
                              padding: "6px 14px",
                              borderRadius: 8,
                              border: "none",
                              background: isProcessing ? "#94a3b8" : "#16a34a",
                              color: "#ffffff",
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: isProcessing ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              boxShadow: "0 2px 4px rgba(22, 163, 74, 0.2)",
                            }}
                          >
                            {isProcessing ? (
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
                            fontSize: 11.5,
                            color: "#16a34a",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            marginTop: 2,
                          }}
                        >
                          <CheckCircle2 size={13} color="#16a34a" />
                          <span>Approved & session transferred</span>
                        </div>
                      )}

                      {isDenied && (
                        <div
                          style={{
                            fontSize: 11.5,
                            color: "#dc2626",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            marginTop: 2,
                          }}
                        >
                          <XCircle size={13} color="#dc2626" />
                          <span>Denied from this device</span>
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
