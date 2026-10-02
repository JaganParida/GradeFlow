import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  ChevronDown,
  CheckCircle2,
  Layers,
  Lock,
  RotateCcw,
  X,
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
 * - Bulletproof mobile body scroll locking and swipe-down dismiss (Instagram-style)
 */
export default function ModernMobileSubNav({
  items = [],
  activeTab = "",
  onChange = () => {},
  onLockedClick = null,
  onResetClick = null,
  title = "Select View",
  subtitle = "",
  themeColor = "#2563eb",
  themeBg = "#eff6ff",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const scrollContainerRef = useRef(null);
  const touchStartY = useRef(null);
  const touchStartX = useRef(null);
  const shouldScrollToSubNav = useRef(false);
  const dragControls = useDragControls();

  const unitName = (title || "").toLowerCase().includes("module") ? "modules" : "views";
  const hintText = subtitle || `Tap below to switch (${items.length} ${unitName})`;

  // Calculate the true document top of ModernMobileSubNav using static anchor
  const getSubNavDocTop = () => {
    const anchor = document.getElementById("gf-mobile-subnav-anchor");
    const navEl = document.getElementById("gf-mobile-subnav");
    const targetEl = anchor || navEl;
    if (!targetEl) return 0;
    const currentScroll = window.pageYOffset || window.scrollY || document.documentElement.scrollTop || 0;
    return Math.max(0, Math.round(currentScroll + targetEl.getBoundingClientRect().top));
  };

  // High-performance 60fps/120fps cubic smooth scrolling to targetY
  const smoothScrollToY = (targetY, duration = 400) => {
    const startY = window.pageYOffset || window.scrollY || document.documentElement.scrollTop || 0;
    const distance = targetY - startY;
    if (Math.abs(distance) < 2) return;

    const startTime = performance.now();
    // Cubic ease-out curve (fast initial motion, silky smooth deceleration)
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeOutCubic(progress);
      const newY = Math.round(startY + distance * ease);

      window.scrollTo(0, newY);
      if (document.documentElement) document.documentElement.scrollTop = newY;
      if (document.body) document.body.scrollTop = newY;

      // Keep Lenis virtual scroll in sync so it doesn't fight or reset
      if (window.__lenis && typeof window.__lenis.scrollTo === "function") {
        try {
          window.__lenis.scrollTo(newY, { immediate: true });
        } catch (_) {}
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  };



  // Bulletproof body scroll lock for mobile & desktop (prevents background scroll, bounce & scroll-chaining)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);

    const scrollY = window.scrollY || window.pageYOffset || 0;
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyWidth = document.body.style.width;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalHtmlOverscroll = document.documentElement.style.overscrollBehavior;

    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    const preventBackdropTouch = (e) => {
      if (e.target && e.target.closest && e.target.closest(".gf-subnav-scrollable")) {
        return;
      }
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchmove", preventBackdropTouch, { passive: false });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("touchmove", preventBackdropTouch);
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.overscrollBehavior = originalHtmlOverscroll;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.width = originalBodyWidth;

      // Restore scroll position AND immediately sync Lenis so it doesn't fight
      window.scrollTo(0, scrollY);
      if (window.__lenis && typeof window.__lenis.scrollTo === "function") {
        try { window.__lenis.scrollTo(scrollY, { immediate: true }); } catch (_) {}
      }

      // If user selected a module from bottom sheet, smooth scroll subnav to top
      if (shouldScrollToSubNav.current) {
        shouldScrollToSubNav.current = false;

        // Wait one frame for layout to settle after body unlock + content change
        requestAnimationFrame(() => {
          const targetY = getSubNavDocTop();
          const distance = Math.abs(targetY - scrollY);

          // Already at/near the subnav top — no scroll needed, stay in place
          if (distance < 15) return;

          // Smooth scroll to subnav position (syncs Lenis on every frame internally)
          smoothScrollToY(targetY, 450);
        });
      }
    };
  }, [isOpen]);

  const handleContentTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleContentTouchEnd = (e) => {
    if (touchStartY.current === null || !e.changedTouches || e.changedTouches.length === 0) return;
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaY = touchEndY - touchStartY.current;
    const deltaX = Math.abs(touchEndX - touchStartX.current);

    // If swiped down at top of content, close sheet like Instagram comments
    const isAtTop = !scrollContainerRef.current || scrollContainerRef.current.scrollTop <= 5;
    if (isAtTop && deltaY > 70 && deltaY > deltaX * 1.5) {
      setIsOpen(false);
    }

    touchStartY.current = null;
    touchStartX.current = null;
  };

  const currentIndex = items.findIndex((it) => it.id === activeTab);
  const activeItem = items[currentIndex] || items[0] || {};

  const handleSelect = (id) => {
    const it = items.find((item) => item.id === id);
    if (it?.isLocked) {
      if (typeof onLockedClick === "function") {
        onLockedClick(it);
      }
      setIsOpen(false);
      return;
    }
    shouldScrollToSubNav.current = true;
    onChange(id, { animation: "fade-up", direction: 0 });
    setIsOpen(false);
  };

  return (
    <>
      {/* Invisible static layout anchor for precise scroll targeting */}
      <div
        id="gf-mobile-subnav-anchor"
        style={{
          position: "relative",
          height: 0,
          width: "100%",
          margin: 0,
          padding: 0,
          border: "none",
          visibility: "hidden",
          pointerEvents: "none",
        }}
      />

      {/* ── Main Sticky Anchor Bar (Arrow pointing to Change button, Zero Box Shadow) ── */}
      <div
        id="gf-mobile-subnav"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 900,
          background: "rgba(248, 250, 252, 0.98)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          padding: "6px 2px 7px 2px",
          width: "100%",
          boxShadow: "none",
        }}
      >
        <div
          onClick={() => setIsOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            width: "100%",
            boxSizing: "border-box",
            cursor: "pointer",
            userSelect: "none",
            padding: "2px 2px",
          }}
        >
          {/* Left: Active Module Name + "Tap to change subtab" with Arrow pointing to [ Change ] */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              flex: 1,
              minWidth: 0,
            }}
          >
            {/* Top: Active Module Name + Counter */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  background: themeBg,
                  color: themeColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {React.isValidElement(activeItem.icon)
                  ? React.cloneElement(activeItem.icon, {
                      size: 12,
                      color: activeItem.icon.props?.color || themeColor,
                    })
                  : activeItem.icon}
              </div>

              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#0f172a",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  letterSpacing: "-0.2px",
                  lineHeight: 1.2,
                }}
              >
                {activeItem.label}
              </span>

              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: themeColor,
                  background: themeBg,
                  padding: "1px 5px",
                  borderRadius: 4,
                  flexShrink: 0,
                  lineHeight: 1.2,
                }}
              >
                {currentIndex + 1}/{items.length}
              </span>
            </div>

            {/* Bottom: "Tap to change subtab" + Long Arrow pointing right to [ Change ] */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                minWidth: 0,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#64748b",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                Tap to change subtab
              </span>

              {/* Pointing Arrow Line */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flex: 1,
                  minWidth: 16,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    height: 1.5,
                    width: "100%",
                    background: `linear-gradient(to right, ${themeColor}33, ${themeColor})`,
                    borderRadius: 1,
                  }}
                />
                <svg
                  width="8"
                  height="10"
                  viewBox="0 0 8 10"
                  fill="none"
                  style={{ flexShrink: 0, marginLeft: -2 }}
                >
                  <path
                    d="M1 1.5L6.5 5L1 8.5"
                    stroke={themeColor}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Right: Rounded "Change" Button (Exactly as drawn in user sketch, ZERO box shadow) */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
            aria-label="Change subtab"
            style={{
              padding: "7px 14px",
              borderRadius: 10,
              border: `1.5px solid ${themeColor}`,
              background: themeBg,
              color: themeColor,
              fontSize: 12.5,
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              cursor: "pointer",
              boxShadow: "none",
              flexShrink: 0,
              transition: "all 0.15s ease",
              letterSpacing: "0.2px",
            }}
          >
            <span>Change</span>
            <ChevronDown size={13} strokeWidth={2.4} />
          </motion.button>
        </div>
      </div>

      {/* ── Interactive Bottom Sheet Drawer (Portaled to document.body for true viewport attachment) ── */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <div
                data-lenis-prevent="true"
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
                  overscrollBehavior: "none",
                  WebkitOverscrollBehavior: "none",
                  touchAction: "none",
                }}
              >
                {/* Backdrop Blur Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  onClick={() => setIsOpen(false)}
                  onTouchMove={(e) => {
                    if (e.cancelable) e.preventDefault();
                  }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(15, 23, 42, 0.45)",
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                    touchAction: "none",
                  }}
                />

                {/* Sheet Card (Silky Smooth iOS Easing & Drag-to-Dismiss like Instagram comments) */}
                <motion.div
                  data-lenis-prevent="true"
                  initial={{ y: "100%", opacity: 0.7 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "100%", opacity: 0.7 }}
                  transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                  drag="y"
                  dragControls={dragControls}
                  dragListener={false}
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={{ top: 0, bottom: 0.75 }}
                  onDragEnd={(e, info) => {
                    if (info.offset.y > 80 || info.velocity.y > 350) {
                      setIsOpen(false);
                    }
                  }}
                  style={{
                    position: "relative",
                    background: "#ffffff",
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    borderTop: "1.5px solid #e2e8f0",
                    boxShadow: "none",
                    maxHeight: "85dvh",
                    width: "100%",
                    maxWidth: "100%",
                    display: "flex",
                    flexDirection: "column",
                    zIndex: 10,
                    boxSizing: "border-box",
                    overflow: "hidden",
                    overscrollBehavior: "contain",
                    WebkitOverscrollBehavior: "contain",
                  }}
                >
                  {/* Swipe Down Drag Zone: Drag Handle & Sheet Header (Pinned at top, primary drag trigger) */}
                  <div
                    onPointerDown={(e) => dragControls.start(e)}
                    style={{
                      touchAction: "none",
                      cursor: "grab",
                      userSelect: "none",
                      WebkitUserSelect: "none",
                      flexShrink: 0,
                    }}
                  >
                    {/* Drag Handle Bar (Generous touch target for effortless pull-down) */}
                    <div
                      style={{
                        width: "100%",
                        padding: "10px 0 6px 0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 4.5,
                          borderRadius: 99,
                          background: "#cbd5e1",
                        }}
                      />
                    </div>

                    {/* Sheet Header */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 14px 10px 14px",
                        borderBottom: "1px solid #f1f5f9",
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
                            flexShrink: 0,
                          }}
                        >
                          <Layers size={15} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 900, color: "#0f172a" }}>
                            {title}
                          </h3>
                          <p style={{ margin: 0, fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                            {items.length} Modules available • Tap to select
                          </p>
                        </div>
                      </div>

                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(false)}
                        aria-label="Close menu"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          border: "1px solid #e2e8f0",
                          background: "#f8fafc",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#64748b",
                          cursor: "pointer",
                          padding: 0,
                          flexShrink: 0,
                        }}
                      >
                        <X size={15} strokeWidth={2.2} />
                      </motion.button>
                    </div>
                  </div>

                  {/* Scrollable Content Container (Guaranteed Responsive, Zero Overflow) */}
                  <div
                    ref={scrollContainerRef}
                    className="gf-subnav-scrollable"
                    data-lenis-prevent="true"
                    onTouchStart={handleContentTouchStart}
                    onTouchEnd={handleContentTouchEnd}
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      WebkitOverflowScrolling: "touch",
                      overscrollBehavior: "contain",
                      WebkitOverscrollBehavior: "contain",
                      padding: "12px 14px calc(20px + env(safe-area-inset-bottom, 0px)) 14px",
                      display: "flex",
                      flexDirection: "column",
                      boxSizing: "border-box",
                    }}
                  >
                    {/* Full-width single-column list of all modules (Guaranteed 100% visible on all mobile widths) */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    >
                      {items.map((item) => {
                        const isActive = item.id === activeTab;
                        return (
                          <motion.button
                            key={item.id}
                            type="button"
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSelect(item.id)}
                            style={{
                              position: "relative",
                              minWidth: 0,
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: 13,
                              border: isActive ? `1.5px solid ${themeColor}` : "1px solid #e2e8f0",
                              background: isActive ? themeBg : "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              textAlign: "left",
                              cursor: item.isLocked ? "not-allowed" : "pointer",
                              opacity: item.isLocked ? 0.55 : 1,
                              filter: item.isLocked ? "grayscale(0.6)" : "none",
                              boxShadow: "none",
                              transition: "all 0.15s ease",
                              boxSizing: "border-box",
                            }}
                          >
                            {/* Icon Tile */}
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
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
                                    size: 18,
                                    color: isActive ? "#ffffff" : (item.icon.props?.color || "#475569"),
                                  })
                                : item.icon}
                            </div>

                            {/* Title & Description */}
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 2,
                                flex: 1,
                                minWidth: 0,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 750,
                                  color: isActive ? themeColor : "#0f172a",
                                  lineHeight: 1.25,
                                  wordBreak: "break-word",
                                  overflowWrap: "anywhere",
                                }}
                              >
                                {item.label}
                              </span>
                              {item.desc && (
                                <span
                                  style={{
                                    fontSize: 11,
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

                            {/* Status Tag: Locked badge or Active Tag */}
                            {item.isLocked ? (
                              <div
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                  background: "#f1f5f9",
                                  border: "1px solid #e2e8f0",
                                  padding: "3px 6px",
                                  borderRadius: 6,
                                  fontSize: 9.5,
                                  fontWeight: 800,
                                  color: "#64748b",
                                  flexShrink: 0,
                                  pointerEvents: "none",
                                }}
                              >
                                <Lock size={10} color="#64748b" />
                                <span>LOCKED</span>
                              </div>
                            ) : isActive ? (
                              <div
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  padding: "3.5px 8.5px",
                                  borderRadius: 7,
                                  background: "#ffffff",
                                  border: `1px solid ${themeColor}33`,
                                  color: themeColor,
                                  fontSize: 11,
                                  fontWeight: 750,
                                  flexShrink: 0,
                                  pointerEvents: "none",
                                }}
                              >
                                <CheckCircle2 size={13} color={themeColor} strokeWidth={2.4} />
                                <span>Active</span>
                              </div>
                            ) : null}
                          </motion.button>
                        );
                      })}
                    </div>

                    {onResetClick && (
                      <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            onResetClick();
                          }}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 7,
                            padding: "9px 12px",
                            borderRadius: 10,
                            border: "1px solid #fee2e2",
                            background: "#fff5f5",
                            color: "#dc2626",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <RotateCcw size={13} color="#dc2626" />
                          <span>Reset Attendance Data</span>
                        </button>
                      </div>
                    )}
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
