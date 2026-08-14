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

  useEffect(() => {
    // Check if user has already seen the v2 upgrade announcement on this device
    const hasSeen = localStorage.getItem("gf_v2_upgrade_popup_seen");
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
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
            padding: "16px",
            overflowY: "auto",
          }}
        >
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={handleDismiss}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: "spring", damping: 28, stiffness: 340 }}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 580,
              background: "#ffffff",
              borderRadius: 24,
              border: "1px solid #e2e8f0",
              boxShadow:
                "0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.05)",
              overflow: "hidden",
              zIndex: 10,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {/* Top Decorative Gradient Ribbon */}
            <div
              style={{
                height: 6,
                width: "100%",
                background: "linear-gradient(90deg, #2563eb, #8b5cf6, #ec4899, #f59e0b)",
              }}
            />

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              aria-label="Close Announcement"
              style={{
                position: "absolute",
                top: 18,
                right: 18,
                width: 34,
                height: 34,
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
                zIndex: 2,
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
              <X size={17} />
            </button>

            {/* Modal Body */}
            <div style={{ padding: "28px 28px 24px 28px" }}>
              {/* Badge */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 12px",
                  borderRadius: 20,
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#1d4ed8",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: "0.2px",
                  marginBottom: 14,
                }}
              >
                <Sparkles size={14} color="#2563eb" />
                <span>MAJOR UPGRADE • GRADEFLOW 2.0</span>
              </div>

              {/* Title & Subtitle */}
              <h2
                id="upgrade-modal-title"
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: "#0f172a",
                  lineHeight: 1.25,
                  margin: "0 0 8px 0",
                  letterSpacing: "-0.5px",
                }}
              >
                Welcome to the All-New Look of GradeFlow! 🎉
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "#64748b",
                  lineHeight: 1.55,
                  margin: "0 0 20px 0",
                }}
              >
                We have completely redesigned GradeFlow from the ground up with a cleaner,
                faster interface, richer academic analytics, and silky smooth transitions.
              </p>

              {/* Feature Highlights Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                  gap: 10,
                  marginBottom: 24,
                }}
              >
                {/* Feature 1 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "12px 14px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 14,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: "#dbeafe",
                      color: "#2563eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <Zap size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                      Silky Page Transitions
                    </div>
                    <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.4 }}>
                      Smooth website-wide animated page loads and seamless tabs.
                    </div>
                  </div>
                </div>

                {/* Feature 2 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "12px 14px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 14,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: "#f3e8ff",
                      color: "#7e22ce",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <BarChart2 size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                      Grade Distribution Suite
                    </div>
                    <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.4 }}>
                      Full letter-grade charts, honours ratio & curriculum radar.
                    </div>
                  </div>
                </div>

                {/* Feature 3 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "12px 14px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 14,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: "#fef3c7",
                      color: "#b45309",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <Layers size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                      Refined Modern UI/UX
                    </div>
                    <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.4 }}>
                      Clean typography, official brand favicon & responsive metrics.
                    </div>
                  </div>
                </div>

                {/* Feature 4 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "12px 14px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 14,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: "#dcfce7",
                      color: "#15803d",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                      Hardened Security
                    </div>
                    <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.4 }}>
                      Multi-tier rate limits, HTTPS HttpOnly cookie protections.
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                {/* Secondary Button: Leave a Review */}
                <button
                  onClick={handleOpenReview}
                  style={{
                    flex: "1 1 180px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "13px 18px",
                    borderRadius: 12,
                    background: "#fffbeb",
                    border: "1.5px solid #fde68a",
                    color: "#b45309",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: "0 1px 3px rgba(245, 158, 11, 0.08)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#fef3c7";
                    e.currentTarget.style.borderColor = "#f59e0b";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#fffbeb";
                    e.currentTarget.style.borderColor = "#fde68a";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <Star size={16} fill="#f59e0b" color="#f59e0b" />
                  <span>Leave a Review</span>
                </button>

                {/* Primary Button: Explore Gradeflow */}
                <button
                  onClick={handleDismiss}
                  style={{
                    flex: "1 1 200px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "13px 20px",
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                    border: "1px solid #1e40af",
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "linear-gradient(135deg, #1d4ed8, #1e40af)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 6px 18px rgba(37, 99, 235, 0.35)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "linear-gradient(135deg, #2563eb, #1d4ed8)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(37, 99, 235, 0.25)";
                  }}
                >
                  <span>Explore New GradeFlow</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
