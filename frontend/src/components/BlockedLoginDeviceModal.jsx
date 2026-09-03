import React, { useState, useEffect } from "react";
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
  onTransferSession,
}) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );
  const [isTiny, setIsTiny] = useState(
    typeof window !== "undefined" ? window.innerWidth < 380 : false
  );

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth < 640);
        setIsTiny(window.innerWidth < 380);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isOpen) return null;

  const isFullyBlocked = Array.isArray(activeDevices) && activeDevices.length >= maxAllowed;
  const devicesList = Array.isArray(activeDevices) ? activeDevices : [];

  const getDeviceIcon = (deviceType) => {
    const iconSize = isMobile ? 18 : 20;
    switch (deviceType?.toLowerCase()) {
      case "mobile":
        return <Smartphone size={iconSize} color="#2563eb" />;
      case "tablet":
        return <Tablet size={iconSize} color="#7c3aed" />;
      case "desktop":
      case "laptop":
      default:
        return <Laptop size={iconSize} color="#2563eb" />;
    }
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10000005,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isMobile ? "12px 10px" : "16px",
          backgroundColor: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          boxSizing: "border-box",
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
            borderRadius: isMobile ? "16px" : "20px",
            boxShadow: "0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(15, 23, 42, 0.05)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            maxHeight: "92vh",
            boxSizing: "border-box",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Header Banner */}
          <div
            style={{
              padding: isMobile ? "14px 16px" : "20px 24px",
              background: isFullyBlocked
                ? "linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)"
                : "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)",
              borderBottom: `1px solid ${isFullyBlocked ? "#fee2e2" : "#dbeafe"}`,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: isMobile ? "10px" : "16px",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: isMobile ? "10px" : "14px" }}>
              <div
                style={{
                  width: isMobile ? "38px" : "44px",
                  height: isMobile ? "38px" : "44px",
                  borderRadius: isMobile ? "10px" : "12px",
                  backgroundColor: isFullyBlocked ? "#fee2e2" : "#dbeafe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: isFullyBlocked
                    ? "0 2px 6px rgba(220, 38, 38, 0.12)"
                    : "0 2px 6px rgba(37, 99, 235, 0.12)",
                }}
              >
                <ShieldAlert size={isMobile ? 20 : 24} color={isFullyBlocked ? "#dc2626" : "#2563eb"} />
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: isMobile ? "16px" : "18px",
                    fontWeight: "900",
                    color: isFullyBlocked ? "#991b1b" : "#1e40af",
                    letterSpacing: "-0.3px",
                    lineHeight: "1.25",
                  }}
                >
                  {isFullyBlocked ? "Device Limit Reached" : "Active Device Information"}
                </h3>
                <p
                  style={{
                    margin: "3px 0 0 0",
                    fontSize: isMobile ? "12px" : "13px",
                    color: isFullyBlocked ? "#7f1d1d" : "#1e3a8a",
                    lineHeight: "1.4",
                  }}
                >
                  {isFullyBlocked
                    ? `Your account is currently active on ${devicesList.length} of ${maxAllowed} authorized devices (maximum limit reached).`
                    : `Your account is active on ${devicesList.length} of ${maxAllowed} authorized devices. Sign-in is permitted.`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: isFullyBlocked ? "#991b1b" : "#1e40af",
                cursor: "pointer",
                padding: "6px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s",
                flexShrink: 0,
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
              padding: isMobile ? "14px 16px" : "20px 24px",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              display: "flex",
              flexDirection: "column",
              gap: isMobile ? "12px" : "16px",
              boxSizing: "border-box",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: isMobile ? "11px" : "12px",
                  fontWeight: "800",
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: isMobile ? "8px" : "10px",
                }}
              >
                Currently Logged In:
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: devicesList.length > 1 && !isMobile ? "repeat(auto-fit, minmax(280px, 1fr))" : "1fr",
                  gap: isMobile ? "10px" : "12px",
                  boxSizing: "border-box",
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
                        borderRadius: isMobile ? "12px" : "14px",
                        padding: isMobile ? "12px 14px" : "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: isMobile ? "10px" : "12px",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
                        boxSizing: "border-box",
                      }}
                    >
                      {/* Device Card Header */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          borderBottom: "1px solid #e2e8f0",
                          paddingBottom: isMobile ? "8px" : "10px",
                          gap: "8px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "8px" : "10px" }}>
                          <div
                            style={{
                              width: isMobile ? "30px" : "34px",
                              height: isMobile ? "30px" : "34px",
                              borderRadius: isMobile ? "8px" : "10px",
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
                                fontSize: isMobile ? "13px" : "14px",
                                fontWeight: "800",
                                color: "#0f172a",
                                letterSpacing: "-0.2px",
                              }}
                            >
                              {dev.displayTitle}
                            </div>
                            <div style={{ fontSize: isMobile ? "10px" : "11px", color: "#64748b" }}>
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
                            padding: isMobile ? "2px 7px" : "3px 8px",
                            borderRadius: "999px",
                            backgroundColor: "#dcfce7",
                            color: "#15803d",
                            fontSize: isMobile ? "10.5px" : "11.5px",
                            fontWeight: "800",
                            border: "1px solid #bbf7d0",
                            flexShrink: 0,
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
                      <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "6px" : "8px", fontSize: isMobile ? "12px" : "12.5px" }}>
                        {/* Device Type */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: isTiny ? "flex-start" : "center", flexDirection: isTiny ? "column" : "row", gap: "2px" }}>
                          <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "5px" }}>
                            <Cpu size={12} color="#94a3b8" /> Device type:
                          </span>
                          <span style={{ fontWeight: "700", color: "#1e293b" }}>{dev.deviceType}</span>
                        </div>

                        {/* Operating System */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: isTiny ? "flex-start" : "center", flexDirection: isTiny ? "column" : "row", gap: "2px" }}>
                          <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "5px" }}>
                            <Globe size={12} color="#94a3b8" /> Operating system:
                          </span>
                          <span style={{ fontWeight: "700", color: "#1e293b" }}>{dev.os}</span>
                        </div>

                        {/* Browser */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: isTiny ? "flex-start" : "center", flexDirection: isTiny ? "column" : "row", gap: "2px" }}>
                          <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "5px" }}>
                            <Globe size={12} color="#94a3b8" /> Browser:
                          </span>
                          <span style={{ fontWeight: "700", color: "#1e293b" }}>{dev.browser}</span>
                        </div>

                        {/* Logged in Date & Time */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: isTiny ? "flex-start" : "center", flexDirection: isTiny ? "column" : "row", gap: "2px" }}>
                          <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "5px" }}>
                            <Calendar size={12} color="#94a3b8" /> Logged in:
                          </span>
                          <span style={{ fontWeight: "700", color: "#1e293b", textAlign: isTiny ? "left" : "right" }}>
                            {formatLoginDateTime(dev.loggedInAt)}
                          </span>
                        </div>

                        {/* Last Active Time */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: isTiny ? "flex-start" : "center", flexDirection: isTiny ? "column" : "row", gap: "2px" }}>
                          <span style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "5px" }}>
                            <Clock size={12} color="#94a3b8" /> Last active:
                          </span>
                          <span style={{ fontWeight: "700", color: "#1e293b", textAlign: isTiny ? "left" : "right" }}>
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
                backgroundColor: isFullyBlocked ? "#fef2f2" : "#f0fdf4",
                border: `1px solid ${isFullyBlocked ? "#fee2e2" : "#bbf7d0"}`,
                borderRadius: isMobile ? "10px" : "12px",
                padding: isMobile ? "10px 12px" : "12px 14px",
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                fontSize: isMobile ? "11.5px" : "12px",
                color: isFullyBlocked ? "#991b1b" : "#166534",
                lineHeight: "1.45",
                boxSizing: "border-box",
              }}
            >
              <Info size={15} color={isFullyBlocked ? "#dc2626" : "#16a34a"} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                {isFullyBlocked ? (
                  <>
                    To sign in on this new device, please <strong>log out</strong> from your existing active session first.
                    For institutional data security, concurrent logins beyond the authorized limit are strictly blocked.
                  </>
                ) : (
                  <>
                    Your account has available device slots (<strong>{devicesList.length}/{maxAllowed}</strong> used). You may sign in on this device by completing verification.
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: isMobile ? "12px 16px" : "14px 24px",
              backgroundColor: "#f8fafc",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: onTransferSession ? "space-between" : "flex-end",
              flexWrap: isMobile ? "wrap" : "nowrap",
              gap: 10,
              boxSizing: "border-box",
            }}
          >
            {onTransferSession && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onTransferSession();
                }}
                style={{
                  padding: isMobile ? "10px 16px" : "9px 18px",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: isMobile ? "13.5px" : "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                  width: isMobile ? "100%" : "auto",
                  textAlign: "center",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
              >
                Transfer Session to this Device
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: isMobile ? "10px 16px" : "9px 20px",
                backgroundColor: onTransferSession ? "#ffffff" : "#0f172a",
                color: onTransferSession ? "#334155" : "#ffffff",
                border: onTransferSession ? "1.5px solid #cbd5e1" : "none",
                borderRadius: "10px",
                fontSize: isMobile ? "13.5px" : "13px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "background 0.15s ease",
                width: isMobile ? "100%" : "auto",
                textAlign: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = onTransferSession ? "#f1f5f9" : "#1e293b")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = onTransferSession ? "#ffffff" : "#0f172a")}
            >
              {onTransferSession ? "Close" : "Understood"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
