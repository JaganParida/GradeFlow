import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  LayoutGrid,
  CheckCircle2,
  X,
  Layers,
  Lock,
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
  onLockedClick = null,
  title = "Select View",
  subtitle = "",
  themeColor = "#2563eb",
  themeBg = "#eff6ff",
}) {
  const [isOpen, setIsOpen] = useState(false);

  const unitName = (title || "").toLowerCase().includes("module") ? "modules" : "views";
  const hintText = subtitle || `Tap below to switch (${items.length} ${unitName})`;

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

  const handleSelect = (id) => {
    const it = items.find((item) => item.id === id);
    if (it?.isLocked) {
      if (typeof onLockedClick === "function") {
        onLockedClick(it);
      }
      return;
    }
    onChange(id, { animation: "fade-up", direction: 0 });
    setIsOpen(false);
    scrollToActiveContent();
  };

  return (
    <>
      {/* ── Main Sticky Anchor Bar (Modern, Spacious, Mobile-First UI, Zero Wrapping) ── */}
      <div
        id="gf-mobile-subnav"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: "rgba(248, 250, 252, 0.96)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          padding: "4px 0 8px 0",
          width: "100%",
        }}
      >
        {/* Micro-Header above nav card: Informs user what this section is and how to use it */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "2px 4px 6px 4px",
            userSelect: "none",
            gap: 6,
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, minWidth: 0 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: themeColor,
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#475569",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title || "Navigation Menu"}
            </span>
          </div>

          <span
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              color: "#64748b",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            <span>{hintText}</span>
          </span>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            padding: "10px 13px",
            minHeight: 58,
            boxSizing: "border-box",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            userSelect: "none",
          }}
        >
          {/* Left: Active Module Clickable Pill (Opens Drawer, Guaranteed No Wrapping) */}
          <div
            onClick={() => setIsOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              minWidth: 0,
              flex: 1,
              cursor: "pointer",
            }}
          >
            {/* Active Icon Container (Comfortable 40x40 touch-friendly tile) */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: themeBg,
                border: `1px solid ${themeColor}22`,
                color: themeColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {React.isValidElement(activeItem.icon)
                ? React.cloneElement(activeItem.icon, {
                    size: 20,
                    color: activeItem.icon.props?.color || themeColor,
                  })
                : activeItem.icon}
            </div>

            {/* Title & Status Indicator Stack */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                minWidth: 0,
                flex: 1,
              }}
            >
              <span
                style={{
                  fontSize: 13.5,
                  fontWeight: 800,
                  color: "#0f172a",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  letterSpacing: "-0.25px",
                  lineHeight: 1.25,
                }}
              >
                {activeItem.label}
              </span>

              {/* Sub-row: Pill counter + Browse action hint (Guaranteed single line, never wraps!) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 2.5,
                  flexWrap: "nowrap",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: themeColor,
                    background: themeBg,
                    padding: "1.5px 6.5px",
                    borderRadius: 5,
                    lineHeight: 1.3,
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  {currentIndex + 1} of {items.length}
                </span>

                <span style={{ fontSize: 9, color: "#cbd5e1", flexShrink: 0 }}>•</span>

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#64748b",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    lineHeight: 1.3,
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>Change</span>
                  <ChevronDown size={11} strokeWidth={2.4} color={themeColor} />
                </span>
              </div>
            </div>
          </div>

          {/* Right: Modern Compact All Modules Pill Button */}
          <motion.button
            type="button"
            className="gf-subnav-all-btn"
            whileTap={{ scale: 0.94 }}
            onClick={() => setIsOpen(true)}
            title="Open all modules menu"
            aria-label="All views"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              height: 34,
              padding: "0 10px",
              borderRadius: 9,
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              color: "#0f172a",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
              transition: "all 0.15s ease",
              flexShrink: 0,
            }}
          >
            <LayoutGrid size={13} strokeWidth={2.4} color={themeColor} />
            <span>All</span>
            <ChevronDown size={11} strokeWidth={2.4} color="#64748b" />
          </motion.button>
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
                padding: "14px 14px",
                paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))",
                maxHeight: "85dvh",
                width: "100%",
                maxWidth: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 12,
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

              {/* Visual Grid of All Views (Guaranteed Responsive, Zero Overflow) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: items.length <= 4 ? "1fr" : "repeat(2, minmax(0, 1fr))",
                  gap: 8,
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
                        position: "relative",
                        minWidth: 0,
                        width: "100%",
                        padding: "11px 10px",
                        borderRadius: 14,
                        border: isActive ? `1.5px solid ${themeColor}` : "1px solid #e2e8f0",
                        background: isActive ? themeBg : "#ffffff",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        textAlign: "left",
                        cursor: item.isLocked ? "not-allowed" : "pointer",
                        opacity: item.isLocked ? 0.55 : 1,
                        filter: item.isLocked ? "grayscale(0.6)" : "none",
                        boxShadow: "none",
                        transition: "all 0.15s ease",
                        boxSizing: "border-box",
                        overflow: "hidden",
                      }}
                    >
                      {/* Icon */}
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: isActive ? themeColor : "#f1f5f9",
                          color: isActive ? "#ffffff" : "#475569",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {React.isValidElement(item.icon)
                          ? React.cloneElement(item.icon, {
                              size: 16,
                              color: isActive ? "#ffffff" : (item.icon.props?.color || "#475569"),
                            })
                          : item.icon}
                      </div>

                      {/* Title & Description */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2.5,
                          flex: 1,
                          minWidth: 0,
                          paddingRight: isActive ? 18 : 0,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", minWidth: 0 }}>
                          <span
                            style={{
                              fontSize: 12.5,
                              fontWeight: 800,
                              color: isActive ? themeColor : "#0f172a",
                              lineHeight: 1.25,
                              wordBreak: "break-word",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {item.label}
                          </span>
                        </div>
                        {item.desc && (
                          <span
                            style={{
                              fontSize: 10.5,
                              color: isActive ? "#334155" : "#64748b",
                              lineHeight: 1.35,
                              fontWeight: 500,
                              wordBreak: "break-word",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {item.desc}
                          </span>
                        )}
                      </div>

                      {/* Top-Right Badge: Locked badge if locked, Active Tick if active */}
                      {item.isLocked ? (
                        <div
                          style={{
                            position: "absolute",
                            top: 9,
                            right: 9,
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                            background: "#f1f5f9",
                            border: "1px solid #e2e8f0",
                            padding: "2px 5px",
                            borderRadius: 4,
                            fontSize: 9,
                            fontWeight: 800,
                            color: "#64748b",
                            pointerEvents: "none",
                          }}
                        >
                          <Lock size={10} color="#64748b" />
                          <span>LOCKED</span>
                        </div>
                      ) : isActive ? (
                        <div
                          style={{
                            position: "absolute",
                            top: 9,
                            right: 9,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            pointerEvents: "none",
                          }}
                        >
                          <CheckCircle2 size={15} color={themeColor} strokeWidth={2.4} />
                        </div>
                      ) : null}
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
