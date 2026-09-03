import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  CheckCircle2,
  X,
  Layers,
} from "lucide-react";

/**
 * ModernMobileSubNav
 * Premium, interactive mobile sub-navigation replacing horizontal scrollable tabs.
 * Features:
 * - Active view indicator card
 * - 1-tap fast Prev/Next navigation
 * - Full visual bottom sheet drawer with all available views
 * - High-contrast icons, descriptions, and active badges
 * - Zero layout shift or horizontal scrolling fatigue
 */
export default function ModernMobileSubNav({
  items = [],
  activeTab = "",
  onChange = () => {},
  title = "Select View",
  themeColor = "#2563eb",
  themeBg = "#eff6ff",
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Close drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const currentIndex = items.findIndex((it) => it.id === activeTab);
  const activeItem = items[currentIndex] || items[0] || {};

  const scrollToActiveContent = () => {
    try {
      const navEl = document.getElementById("gf-mobile-subnav");
      if (navEl) {
        const rect = navEl.getBoundingClientRect();
        const targetY = window.pageYOffset + rect.top - 8;
        window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
      }
    } catch (err) {
      // ignore
    }
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    const nextIdx = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
    const targetId = items[nextIdx]?.id;
    if (targetId) {
      onChange(targetId, { animation: "slide-right", direction: -1 });
      scrollToActiveContent();
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    const nextIdx = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
    const targetId = items[nextIdx]?.id;
    if (targetId) {
      onChange(targetId, { animation: "slide-left", direction: 1 });
      scrollToActiveContent();
    }
  };

  const handleSelect = (id) => {
    onChange(id, { animation: "fade-up", direction: 0 });
    setIsOpen(false);
    scrollToActiveContent();
  };

  return (
    <>
      {/* ── Main Sticky Anchor Bar (Clean Big-Tech Professional UI) ── */}
      <div
        id="gf-mobile-subnav"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: "rgba(241, 245, 249, 0.96)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          padding: "2px 0 6px 0",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "6px 8px 6px 10px",
            boxShadow: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            userSelect: "none",
          }}
        >
          {/* Left: Active Module Clickable Pill (Opens Drawer) */}
          <div
            onClick={() => setIsOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 0,
              flex: 1,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: themeBg,
                border: `1px solid ${themeColor}33`,
                color: themeColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {activeItem.icon}
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#0f172a",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  letterSpacing: "-0.2px",
                  lineHeight: 1.25,
                }}
              >
                {activeItem.label}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", lineHeight: 1.2 }}>
                View {currentIndex + 1} of {items.length} · Tap to browse
              </span>
            </div>
          </div>

          {/* Right: Modern Segmented Navigation & "All" Pill */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {/* Segmented Prev / Next Dual Buttons */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "#f1f5f9",
                borderRadius: 8,
                padding: 2,
                border: "1px solid #e2e8f0",
              }}
            >
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={handlePrev}
                title="Previous Module"
                aria-label="Previous view"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: "none",
                  background: "#ffffff",
                  color: "#334155",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  padding: 0,
                  boxShadow: "none",
                  transition: "all 0.15s ease",
                }}
              >
                <ChevronLeft size={16} strokeWidth={2.4} />
              </motion.button>
              <div style={{ width: 1, height: 16, background: "#e2e8f0", margin: "0 1px" }} />
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={handleNext}
                title="Next Module"
                aria-label="Next view"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: "none",
                  background: "#ffffff",
                  color: "#334155",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  padding: 0,
                  boxShadow: "none",
                  transition: "all 0.15s ease",
                }}
              >
                <ChevronRight size={16} strokeWidth={2.4} />
              </motion.button>
            </div>

            {/* "All" Dropdown Pill */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              title="Open all modules menu"
              aria-label="All views"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 10px",
                borderRadius: 10,
                background: themeBg,
                border: `1px solid ${themeColor}33`,
                color: themeColor,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "-0.2px",
                cursor: "pointer",
                height: 32,
                boxSizing: "border-box",
              }}
            >
              <LayoutGrid size={13} strokeWidth={2.4} />
              <span>All</span>
              <ChevronDown size={12} strokeWidth={2.4} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Interactive Bottom Sheet Drawer (Portaled to document.body for true viewport attachment) ── */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: "100vw",
                  height: "100dvh",
                  zIndex: 999999,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  overflow: "hidden",
                }}
              >
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              onClick={() => setIsOpen(false)}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(15, 23, 42, 0.45)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
              }}
            />

            {/* Sheet Card (Silky Smooth iOS Easing) */}
            <motion.div
              initial={{ y: "100%", opacity: 0.7 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0.7 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "relative",
                background: "#ffffff",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                boxShadow: "0 -8px 32px rgba(15, 23, 42, 0.14)",
                padding: "14px 18px",
                paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))",
                maxHeight: "82dvh",
                width: "100%",
                maxWidth: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                zIndex: 10,
                boxSizing: "border-box",
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {/* Drag Handle Bar */}
              <div
                style={{
                  width: 38,
                  height: 4.5,
                  borderRadius: 99,
                  background: "#cbd5e1",
                  margin: "0 auto 2px auto",
                  flexShrink: 0,
                }}
              />

              {/* Sheet Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: 8,
                  borderBottom: "1px solid #f1f5f9",
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: themeBg,
                      color: themeColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Layers size={15} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#0f172a" }}>
                      {title}
                    </h3>
                    <p style={{ margin: 0, fontSize: 11.5, color: "#64748b", fontWeight: 600 }}>
                      {items.length} Modules available • Tap to switch
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close sheet"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    color: "#64748b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Visual Grid of All Views (Zero horizontal scrolling!) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: items.length <= 4 ? "1fr" : "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: 10,
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                {items.map((item, idx) => {
                  const isActive = item.id === activeTab;
                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSelect(item.id)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 14,
                        border: isActive ? `1.5px solid ${themeColor}` : "1px solid #e2e8f0",
                        background: isActive ? themeBg : "#ffffff",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        textAlign: "left",
                        cursor: "pointer",
                        boxShadow: "none",
                        transition: "all 0.15s ease",
                        position: "relative",
                      }}
                    >
                      {/* Icon */}
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 9,
                          background: isActive ? themeColor : "#f1f5f9",
                          color: isActive ? "#ffffff" : "#475569",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {item.icon}
                      </div>

                      {/* Title & Description */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 800,
                              color: isActive ? themeColor : "#0f172a",
                              lineHeight: 1.3,
                            }}
                          >
                            {item.label}
                          </span>
                          {isActive && (
                            <CheckCircle2 size={16} color={themeColor} style={{ flexShrink: 0 }} />
                          )}
                        </div>
                        {item.desc && (
                          <span
                            style={{
                              fontSize: 11,
                              color: isActive ? "#334155" : "#64748b",
                              lineHeight: 1.35,
                              fontWeight: 500,
                            }}
                          >
                            {item.desc}
                          </span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  );
}
