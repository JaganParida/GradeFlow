import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Calendar,
  Compass,
  ShieldCheck,
  ArrowRight,
  X,
  MessageSquare,
} from "lucide-react";
import { useApp } from "../context/AppContext";

export default function UpgradeModal() {
  const {
    maintenance,
    adminToken,
    hasActiveSession,
    studentSession,
    openStudentAuthModal,
  } = useApp();
  const isMaintenanceBlocked = Boolean(maintenance?.enabled && !adminToken);

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Save exact scroll position
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyWidth = document.body.style.width;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    // Bulletproof mobile (iOS & Android) + Desktop background scroll lock
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    const preventBackdropTouch = (e) => {
      if (e.target && e.target.closest && e.target.closest(".gf-modal-scrollable")) {
        return; // Allow scrolling inside the modal's feature area
      }
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchmove", preventBackdropTouch, { passive: false });

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.width = originalBodyWidth;
      document.removeEventListener("touchmove", preventBackdropTouch);
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isMaintenanceBlocked) {
      setIsOpen(false);
      return;
    }
    // Check if user has already seen the upgrade announcement on this device
    const hasSeen = localStorage.getItem("gf_v2_upgrade_popup_seen");
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isMaintenanceBlocked]);

  if (isMaintenanceBlocked) return null;

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem("gf_v2_upgrade_popup_seen", "true");
  };

  const handleOpenReview = () => {
    handleDismiss();
    const isAuth = Boolean(hasActiveSession && studentSession?.regNo);
    if (!isAuth) {
      openStudentAuthModal({ type: "feedback" });
    } else {
      window.dispatchEvent(
        new CustomEvent("open-feedback-modal", { detail: { source: "upgrade_popup" } })
      );
    }
  };

  const FEATURES = [
    {
      icon: BarChart3,
      iconBg: "#eff6ff",
      iconColor: "#2563eb",
      title: "Academic Intelligence",
      desc: "Instant SGPA/CGPA breakdowns, letter distributions, and honours tracking.",
    },
    {
      icon: Calendar,
      iconBg: "#f0fdf4",
      iconColor: "#16a34a",
      title: "Smart Timetable",
      desc: "Live class countdowns, venue routing, and real-time attendance logs.",
    },
    {
      icon: Compass,
      iconBg: "#faf5ff",
      iconColor: "#9333ea",
      title: "Career & Domains",
      desc: "Skill mastery radar, semester milestones, and placement readiness.",
    },
    {
      icon: ShieldCheck,
      iconBg: "#fff7ed",
      iconColor: "#ea580c",
      title: "Protected Sessions",
      desc: "Strict session encryption, zero tracking, and fast cached load times.",
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="upgrade-modal-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            boxSizing: "border-box",
            touchAction: "none",
          }}
        >
          {/* Backdrop Blur & Full Cover */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={handleDismiss}
            onTouchMove={(e) => {
              if (e.cancelable) e.preventDefault();
            }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1,
              background: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              touchAction: "none",
            }}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 480,
              maxHeight: "min(90vh, 580px)",
              display: "flex",
              flexDirection: "column",
              background: "#ffffff",
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              zIndex: 10,
              fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "20px 20px 14px 20px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img
                  src="/webisteLogo.png"
                  alt="GradeFlow Logo"
                  style={{
                    height: 28,
                    width: "auto",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
                <div>
                  <h2
                    id="upgrade-modal-title"
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: "#0f172a",
                      margin: 0,
                      lineHeight: 1.2,
                      letterSpacing: "-0.3px",
                    }}
                  >
                    Welcome to GradeFlow
                  </h2>
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>
                    Academic Intelligence Suite
                  </span>
                </div>
              </div>

              {/* Clean Close Button */}
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Close"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f1f5f9";
                  e.currentTarget.style.color = "#0f172a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f8fafc";
                  e.currentTarget.style.color = "#64748b";
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Scrollable Features Content */}
            <div
              className="gf-modal-scrollable"
              style={{
                padding: "16px 20px",
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
                overscrollBehavior: "contain",
                touchAction: "pan-y",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: "#475569",
                  lineHeight: 1.5,
                  margin: "0 0 4px 0",
                }}
              >
                Designed to give you deep visibility into your university coursework, attendance,
                and career trajectory.
              </p>

              {/* Clean Feature List */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: 8,
                }}
              >
                {FEATURES.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        padding: "10px 12px",
                        background: "#f8fafc",
                        border: "1px solid #f1f5f9",
                        borderRadius: 10,
                        transition: "background 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: item.iconBg,
                          color: item.iconColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      >
                        <Icon size={16} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#0f172a",
                            lineHeight: 1.3,
                          }}
                        >
                          {item.title}
                        </div>
                        <div
                          style={{
                            fontSize: 11.5,
                            color: "#64748b",
                            lineHeight: 1.4,
                            marginTop: 2,
                          }}
                        >
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div
              style={{
                padding: "12px 20px 16px 20px",
                background: "#ffffff",
                borderTop: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexShrink: 0,
              }}
            >
              {/* Secondary: Leave Feedback */}
              <button
                type="button"
                onClick={handleOpenReview}
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  color: "#334155",
                  fontSize: 13,
                  fontWeight: 650,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f8fafc";
                  e.currentTarget.style.borderColor = "#94a3b8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.borderColor = "#cbd5e1";
                }}
              >
                <MessageSquare size={14} />
                <span>Feedback</span>
              </button>

              {/* Primary: Get Started / Explore */}
              <button
                type="button"
                onClick={handleDismiss}
                style={{
                  flex: 1.4,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "10px 16px",
                  borderRadius: 10,
                  background: "#2563eb",
                  border: "1px solid #2563eb",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#1d4ed8";
                  e.currentTarget.style.borderColor = "#1d4ed8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#2563eb";
                  e.currentTarget.style.borderColor = "#2563eb";
                }}
              >
                <span>Get Started</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
