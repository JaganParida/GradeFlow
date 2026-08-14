import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Zap,
  BarChart2,
  ShieldCheck,
  Star,
  ArrowRight,
  X,
  Layers,
} from "lucide-react";

export default function UpgradeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => (typeof window !== "undefined" ? window.innerWidth < 640 || window.innerHeight < 700 : false)
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640 || window.innerHeight < 700);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Check if user has already seen the v2 upgrade announcement on this device
    const hasSeen = localStorage.getItem("gf_v2_upgrade_popup_seen");
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem("gf_v2_upgrade_popup_seen", "true");
  };

  const handleOpenReview = () => {
    handleDismiss();
    // Dispatch event to open the Feedback & Review modal seamlessly
    window.dispatchEvent(
      new CustomEvent("open-feedback-modal", { detail: { source: "upgrade_popup" } })
    );
  };

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
            padding: isMobile ? "8px" : "16px",
            boxSizing: "border-box",
          }}
        >
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={handleDismiss}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.68)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: "spring", damping: 28, stiffness: 360 }}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 540,
              maxHeight: "min(92vh, 600px)",
              display: "flex",
              flexDirection: "column",
              background: "#ffffff",
              borderRadius: isMobile ? 18 : 22,
              border: "1px solid #e2e8f0",
              boxShadow:
                "0 25px 50px -12px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(15, 23, 42, 0.05)",
              overflow: "hidden",
              zIndex: 10,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {/* Top Decorative Gradient Ribbon */}
            <div
              style={{
                height: 4,
                width: "100%",
                background: "linear-gradient(90deg, #2563eb, #8b5cf6, #ec4899, #f59e0b)",
                flexShrink: 0,
              }}
            />

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              aria-label="Close Announcement"
              style={{
                position: "absolute",
                top: isMobile ? 10 : 14,
                right: isMobile ? 10 : 14,
                width: isMobile ? 28 : 32,
                height: isMobile ? 28 : 32,
                borderRadius: "50%",
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.15s ease",
                padding: 0,
                zIndex: 5,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#e2e8f0";
                e.currentTarget.style.color = "#0f172a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f1f5f9";
                e.currentTarget.style.color = "#64748b";
              }}
            >
              <X size={isMobile ? 14 : 16} />
            </button>

            {/* Scrollable Modal Content */}
            <div
              style={{
                padding: isMobile ? "14px 14px 10px 14px" : "22px 24px 14px 24px",
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                flex: 1,
              }}
            >
              {/* Badge */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: isMobile ? "2px 8px" : "3px 10px",
                  borderRadius: 16,
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#1d4ed8",
                  fontSize: isMobile ? 10 : 11.5,
                  fontWeight: 800,
                  letterSpacing: "0.2px",
                  marginBottom: isMobile ? 6 : 10,
                }}
              >
                <Sparkles size={isMobile ? 12 : 13} color="#2563eb" />
                <span>MAJOR UPGRADE • GRADEFLOW 2.0</span>
              </div>

              {/* Title & Subtitle */}
              <h2
                id="upgrade-modal-title"
                style={{
                  fontSize: isMobile ? 17 : 22,
                  fontWeight: 900,
                  color: "#0f172a",
                  lineHeight: 1.25,
                  margin: "0 0 4px 0",
                  letterSpacing: "-0.4px",
                  paddingRight: 24,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>Welcome to the All-New Look of GradeFlow!</span>
                <Sparkles size={20} color="#2563eb" style={{ flexShrink: 0 }} />
              </h2>
              <p
                style={{
                  fontSize: isMobile ? 11.5 : 13,
                  color: "#64748b",
                  lineHeight: 1.45,
                  margin: isMobile ? "0 0 10px 0" : "0 0 16px 0",
                }}
              >
                We've redesigned GradeFlow with a cleaner UI, faster navigation, richer analytics,
                and silky smooth transitions.
              </p>

              {/* Feature Highlights Grid (2 columns on both mobile & desktop) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: isMobile ? 6 : 10,
                  marginBottom: isMobile ? 12 : 18,
                }}
              >
                {/* Feature 1 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: isMobile ? 7 : 9,
                    padding: isMobile ? "8px 9px" : "10px 12px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: isMobile ? 10 : 12,
                  }}
                >
                  <div
                    style={{
                      width: isMobile ? 24 : 28,
                      height: isMobile ? 24 : 28,
                      borderRadius: 7,
                      background: "#dbeafe",
                      color: "#2563eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <Zap size={isMobile ? 13 : 15} />
                  </div>
                  <div>
                    <div style={{ fontSize: isMobile ? 11 : 12.5, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                      Silky Transitions
                    </div>
                    <div style={{ fontSize: isMobile ? 9.5 : 11, color: "#64748b", lineHeight: 1.3, marginTop: 1 }}>
                      Smooth animated page loads & sub-tabs.
                    </div>
                  </div>
                </div>

                {/* Feature 2 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: isMobile ? 7 : 9,
                    padding: isMobile ? "8px 9px" : "10px 12px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: isMobile ? 10 : 12,
                  }}
                >
                  <div
                    style={{
                      width: isMobile ? 24 : 28,
                      height: isMobile ? 24 : 28,
                      borderRadius: 7,
                      background: "#f3e8ff",
                      color: "#7e22ce",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <BarChart2 size={isMobile ? 13 : 15} />
                  </div>
                  <div>
                    <div style={{ fontSize: isMobile ? 11 : 12.5, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                      Grade Distribution
                    </div>
                    <div style={{ fontSize: isMobile ? 9.5 : 11, color: "#64748b", lineHeight: 1.3, marginTop: 1 }}>
                      Letter charts, honours ratio & radar.
                    </div>
                  </div>
                </div>

                {/* Feature 3 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: isMobile ? 7 : 9,
                    padding: isMobile ? "8px 9px" : "10px 12px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: isMobile ? 10 : 12,
                  }}
                >
                  <div
                    style={{
                      width: isMobile ? 24 : 28,
                      height: isMobile ? 24 : 28,
                      borderRadius: 7,
                      background: "#fef3c7",
                      color: "#b45309",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <Layers size={isMobile ? 13 : 15} />
                  </div>
                  <div>
                    <div style={{ fontSize: isMobile ? 11 : 12.5, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                      Refined Modern UI
                    </div>
                    <div style={{ fontSize: isMobile ? 9.5 : 11, color: "#64748b", lineHeight: 1.3, marginTop: 1 }}>
                      Clean typography & responsive stats.
                    </div>
                  </div>
                </div>

                {/* Feature 4 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: isMobile ? 7 : 9,
                    padding: isMobile ? "8px 9px" : "10px 12px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: isMobile ? 10 : 12,
                  }}
                >
                  <div
                    style={{
                      width: isMobile ? 24 : 28,
                      height: isMobile ? 24 : 28,
                      borderRadius: 7,
                      background: "#dcfce7",
                      color: "#15803d",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <ShieldCheck size={isMobile ? 13 : 15} />
                  </div>
                  <div>
                    <div style={{ fontSize: isMobile ? 11 : 12.5, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                      Hardened Security
                    </div>
                    <div style={{ fontSize: isMobile ? 9.5 : 11, color: "#64748b", lineHeight: 1.3, marginTop: 1 }}>
                      Rate limits & cookie protections.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pinned Bottom Actions Bar */}
            <div
              style={{
                padding: isMobile ? "10px 14px 12px 14px" : "12px 24px 18px 24px",
                background: "#ffffff",
                borderTop: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
              }}
            >
              {/* Secondary Button: Leave a Review */}
              <button
                onClick={handleOpenReview}
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: isMobile ? "9px 10px" : "11px 16px",
                  borderRadius: 10,
                  background: "#fffbeb",
                  border: "1.5px solid #fde68a",
                  color: "#b45309",
                  fontSize: isMobile ? 12 : 13.5,
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fef3c7";
                  e.currentTarget.style.borderColor = "#f59e0b";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#fffbeb";
                  e.currentTarget.style.borderColor = "#fde68a";
                }}
              >
                <Star size={isMobile ? 13 : 15} fill="#f59e0b" color="#f59e0b" />
                <span>Leave a Review</span>
              </button>

              {/* Primary Button: Explore Gradeflow */}
              <button
                onClick={handleDismiss}
                style={{
                  flex: 1.2,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: isMobile ? "9px 12px" : "11px 18px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  border: "1px solid #1e40af",
                  color: "#ffffff",
                  fontSize: isMobile ? 12 : 13.5,
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.22)",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, #1d4ed8, #1e40af)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, #2563eb, #1d4ed8)";
                }}
              >
                <span>Explore GradeFlow</span>
                <ArrowRight size={isMobile ? 13 : 15} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
