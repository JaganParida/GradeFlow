import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  ShieldAlert,
  X,
  Clock,
  Calendar,
  Globe,
  Cpu,
  Info,
} from "lucide-react";
import { parseDeviceDetails, formatLoginDateTime, formatLastActiveTime } from "../utils/deviceHelper";

export default function BlockedLoginDeviceModal({
  isOpen = false,
  onClose,
  activeDevices = [],
  accountIdentifier = "",
  maxAllowed = 1,
}) {
  if (!isOpen) return null;

  // Normalize device list: fallback if empty
  const devicesList = Array.isArray(activeDevices) && activeDevices.length > 0
    ? activeDevices
    : [{ userAgent: "Unknown", platform: "Unknown", loggedInAt: new Date(), lastActiveAt: new Date(), status: "ACTIVE" }];

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case "mobile":
        return <Smartphone size={20} color="#2563eb" />;
      case "tablet":
        return <Tablet size={20} color="#7c3aed" />;
      case "desktop":
        return <Monitor size={20} color="#059669" />;
      case "laptop":
      default:
        return <Laptop size={20} color="#2563eb" />;
    }
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          backgroundColor: "rgba(15, 23, 42, 0.7)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{
            width: "100%",
            maxWidth: devicesList.length > 1 ? "680px" : "480px",
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            maxHeight: "90vh",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Header Banner */}
          <div
            style={{
              padding: "20px 24px",
              background: "linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)",
              borderBottom: "1px solid #fee2e2",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  backgroundColor: "#fee2e2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 2px 6px rgba(220, 38, 38, 0.12)",
                }}
              >
                <ShieldAlert size={24} color="#dc2626" />
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    fontWeight: "900",
                    color: "#991b1b",
                    letterSpacing: "-0.3px",
                  }}
                >
                  Login Not Allowed
                </h3>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "13px",
                    color: "#7f1d1d",
                    lineHeight: "1.4",
                  }}
                >
                  {maxAllowed > 1
                    ? `Your account is already actively logged in on ${devicesList.length} authorized devices (maximum limit: ${maxAllowed}).`
                    : "Your account is already logged in on another device."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "#991b1b",
                cursor: "pointer",
                padding: "6px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#fee2e2")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div
            style={{
              padding: "20px 24px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "800",
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "10px",
                }}
              >
                Currently Logged In:
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: devicesList.length > 1 ? "repeat(auto-fit, minmax(280px, 1fr))" : "1fr",
                  gap: "12px",
                }}
              >
                {devicesList.map((rawDev, idx) => {
                  const dev = parseDeviceDetails(rawDev);
                  return (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: "#f8fafc",
                        border: "1.5px solid #e2e8f0",
                        borderRadius: "14px",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
                      }}
                    >
                      {/* Device Card Header */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          borderBottom: "1px solid #e2e8f0",
                          paddingBottom: "10px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "34px",
                              height: "34px",
                              borderRadius: "10px",
                              backgroundColor: "#eff6ff",
                              border: "1px solid #dbeafe",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {getDeviceIcon(dev.deviceType)}
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: "800",
                                color: "#0f172a",
                                letterSpacing: "-0.2px",
                              }}
                            >
                              {dev.displayTitle}
                            </div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>
                              Device slot {idx + 1} of {maxAllowed}
                            </div>
                          </div>
                        </div>

                        {/* Active Status Badge */}
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "3px 8px",
                            borderRadius: "999px",
                            backgroundColor: "#dcfce7",
                            color: "#15803d",
                            fontSize: "11.5px",
                            fontWeight: "800",
                            border: "1px solid #bbf7d0",
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              backgroundColor: "#16a34a",
                              display: "inline-block",
                            }}
                          />
                          Active
                        </div>
                      </div>

                      {/* Device Information Rows */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12.5px" }}>
                        {/* Device Type */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Cpu size={13} color="#94a3b8" /> Device type:
                          </span>
                          <span style={{ fontWeight: "700", color: "#1e293b" }}>{dev.deviceType}</span>
                        </div>

                        {/* Operating System */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Globe size={13} color="#94a3b8" /> Operating system:
                          </span>
                          <span style={{ fontWeight: "700", color: "#1e293b" }}>{dev.os}</span>
                        </div>

                        {/* Browser */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Globe size={13} color="#94a3b8" /> Browser:
                          </span>
                          <span style={{ fontWeight: "700", color: "#1e293b" }}>{dev.browser}</span>
                        </div>

                        {/* Logged in Date & Time */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Calendar size={13} color="#94a3b8" /> Logged in:
                          </span>
                          <span style={{ fontWeight: "700", color: "#1e293b" }}>
                            {formatLoginDateTime(dev.loggedInAt)}
                          </span>
                        </div>

                        {/* Last Active Time */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Clock size={13} color="#94a3b8" /> Last active:
                          </span>
                          <span style={{ fontWeight: "700", color: "#1e293b" }}>
                            {formatLastActiveTime(dev.lastActiveAt, dev.loggedInAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Informational Policy Notice */}
            <div
              style={{
                backgroundColor: "#f1f5f9",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "12px 14px",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                fontSize: "12px",
                color: "#475569",
                lineHeight: "1.45",
              }}
            >
              <Info size={16} color="#64748b" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                To sign in on this new device, please <strong>log out</strong> from your existing active session first.
                For institutional data security, concurrent logins beyond the authorized limit are strictly blocked.
              </div>
            </div>
          </div>

          {/* Modal Footer (Purely Informational Action) */}
          <div
            style={{
              padding: "14px 24px",
              backgroundColor: "#f8fafc",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "9px 20px",
                backgroundColor: "#0f172a",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1e293b")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0f172a")}
            >
              Understood
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
