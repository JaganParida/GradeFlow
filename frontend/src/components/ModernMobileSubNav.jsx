import React, { useState, useEffect } from "react";
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

  const handlePrev = (e) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      onChange(items[currentIndex - 1].id);
    } else {
      onChange(items[items.length - 1].id);
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (currentIndex < items.length - 1) {
      onChange(items[currentIndex + 1].id);
    } else {
      onChange(items[0].id);
    }
  };

  const handleSelect = (id) => {
    onChange(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* ── Main Sticky Anchor Bar ── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 25,
          background: "#f1f5f9",
          padding: "4px 0 8px 0",
          width: "100%",
        }}
      >
        <div
          onClick={() => setIsOpen(true)}
          style={{
            background: "#ffffff",
            border: "1.5px solid #cbd5e1",
            borderRadius: 14,
            padding: "8px 10px",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            cursor: "pointer",
            userSelect: "none",
            transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          }}
        >
          {/* Left: Active Module Icon & Labels */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: themeBg,
                border: `1.5px solid ${themeColor}33`,
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
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: 800,
                    color: "#0f172a",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    letterSpacing: "-0.2px",
                  }}
                >
                  {activeItem.label}
                </span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>
                View {currentIndex + 1} of {items.length} • Tap to switch
              </span>
            </div>
          </div>

          {/* Right: Prev, Next & All Switcher Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            {/* Prev Arrow */}
            <button
              type="button"
              onClick={handlePrev}
              title="Previous Module"
              aria-label="Previous view"
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                color: "#475569",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.15s ease",
              }}
            >
              <ChevronLeft size={16} />
            </button>

            {/* Next Arrow */}
            <button
              type="button"
              onClick={handleNext}
              title="Next Module"
              aria-label="Next view"
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                color: "#475569",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.15s ease",
              }}
            >
              <ChevronRight size={16} />
            </button>

            {/* "All Views" Action Pill */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 10px",
                borderRadius: 8,
                background: `${themeColor}12`,
                border: `1px solid ${themeColor}33`,
                color: themeColor,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "-0.2px",
              }}
            >
              <LayoutGrid size={13} />
              <span>All</span>
              <ChevronDown size={12} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Interactive Bottom Sheet Drawer (Framer Motion) ── */}
      <AnimatePresence>
        {isOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
            }}
          >
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(15, 23, 42, 0.55)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
              }}
            />

            {/* Sheet Card */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              style={{
                position: "relative",
                background: "#ffffff",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                boxShadow: "0 -8px 32px rgba(15, 23, 42, 0.18)",
                padding: "12px 18px 28px 18px",
                maxHeight: "82vh",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                zIndex: 10,
                boxSizing: "border-box",
                overflowY: "auto",
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
                        border: isActive ? `2px solid ${themeColor}` : "1.5px solid #e2e8f0",
                        background: isActive ? themeBg : "#ffffff",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        textAlign: "left",
                        cursor: "pointer",
                        boxShadow: isActive ? `0 4px 12px ${themeColor}20` : "0 1px 3px rgba(0,0,0,0.02)",
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
      </AnimatePresence>
    </>
  );
}
