import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  LayoutDashboard,
  Clock,
  Percent,
  BarChart2,
  Trophy,
  Menu,
  X,
  BookOpen,
  MessageSquare,
  Code2,
  LogOut,
  GraduationCap,
  ChevronRight,
  Star,
  Info,
  User,
  ExternalLink,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { encodeStudentId } from "../utils/studentIdEncoder";

/**
 * ModernBottomNav
 * Ultra-sleek, native-feeling mobile bottom navigation bar (Instagram / YouTube style).
 * Features:
 * - Fixed firmly at the bottom on all non-home pages
 * - Seamless safe-area inset support (iPhone home indicators, Android gesture bars)
 * - 6 primary navigation destinations: Dashboard, Timetable, Attendance, Analytics, Rankings, More
 * - Modern swipeable bottom sheet drawer for "More" (Resources, Reviews, About Dev, Admin Portal, Sign Out)
 * - Hardware-accelerated 60/120fps physics animations via Framer Motion & drag controls
 * - Strict home/landing page suppression (hidden on "/")
 */
export default function ModernBottomNav() {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const dragControls = useDragControls();
  const scrollContainerRef = useRef(null);
  const touchStartY = useRef(null);
  const touchStartX = useRef(null);

  const {
    studentData,
    studentSession,
    hasActiveSession,
    waitForAuthResolution,
    leaveSession,
    isLoggingOut,
    openStudentAuthModal,
    setPendingDestination,
  } = useApp();

  const isHomePage = location.pathname === "/";

  // Dynamically manage body class for mobile bottom padding on non-home pages
  useEffect(() => {
    if (isHomePage) {
      document.body.classList.remove("gf-has-bottom-nav");
    } else {
      document.body.classList.add("gf-has-bottom-nav");
    }
    return () => {
      document.body.classList.remove("gf-has-bottom-nav");
    };
  }, [isHomePage, location.pathname]);

  // Lock body scroll when "More" bottom sheet is open
  useEffect(() => {
    if (!isMoreOpen) {
      setShowLogoutConfirm(false);
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsMoreOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMoreOpen]);

  // Close sheet on route change
  useEffect(() => {
    setIsMoreOpen(false);
    setShowLogoutConfirm(false);
  }, [location.pathname]);

  // Touch gesture listener to dismiss bottom sheet on pull-down from top
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

    const isAtTop = !scrollContainerRef.current || scrollContainerRef.current.scrollTop <= 5;
    if (isAtTop && deltaY > 70 && deltaY > deltaX * 1.5) {
      setIsMoreOpen(false);
    }

    touchStartY.current = null;
    touchStartX.current = null;
  };

  // Do not render anything on Home / Landing page
  if (isHomePage) {
    return null;
  }

  // Active student reg calculation
  let localReg = "";
  try { localReg = localStorage.getItem("gf_student_reg") || ""; } catch {}
  const loggedInRegNo = studentSession?.regNo || localReg || "";
  const currentRegNo = studentData?.regNo || loggedInRegNo || "";

  const getResolvedStudentTarget = async () => {
    if (currentRegNo) return currentRegNo;
    const resolvedSession = await waitForAuthResolution();
    return resolvedSession?.regNo || "";
  };

  // Handlers for Bottom Bar Items
  const handleDashboardClick = async () => {
    setIsMoreOpen(false);
    const target = await getResolvedStudentTarget();
    if (!target) {
      setPendingDestination({ type: "dashboard" });
      openStudentAuthModal();
    } else {
      navigate(`/dashboard/${encodeStudentId(target)}`);
    }
  };

  const handleTimetableClick = async () => {
    setIsMoreOpen(false);
    const target = await getResolvedStudentTarget();
    if (!target) {
      setPendingDestination({ type: "timetable" });
      openStudentAuthModal();
    } else {
      navigate(`/timetable/${encodeStudentId(target)}`);
    }
  };

  const handleAttendanceClick = async () => {
    setIsMoreOpen(false);
    const target = await getResolvedStudentTarget();
    if (!target) {
      setPendingDestination({ type: "attendance" });
      openStudentAuthModal();
    } else {
      navigate(`/attendance/${encodeStudentId(target)}`);
    }
  };

  const handleAnalyticsClick = async () => {
    setIsMoreOpen(false);
    const target = await getResolvedStudentTarget();
    if (!target) {
      setPendingDestination({ type: "analytics" });
      openStudentAuthModal();
    } else {
      navigate(`/analytics/${encodeStudentId(target)}`);
    }
  };

  const handleRankingsClick = async () => {
    setIsMoreOpen(false);
    const target = await getResolvedStudentTarget();
    if (!target && !hasActiveSession) {
      setPendingDestination({ type: "leaderboard" });
      openStudentAuthModal();
    } else {
      navigate("/leaderboard");
    }
  };

  // Active status checks for Bottom Bar
  const isDashboardActive = location.pathname.startsWith("/dashboard");
  const isTimetableActive = location.pathname.startsWith("/timetable");
  const isAttendanceActive = location.pathname.startsWith("/attendance");
  const isAnalyticsActive = location.pathname.startsWith("/analytics");
  const isRankingsActive = location.pathname.startsWith("/leaderboard");
  const isMoreActive =
    isMoreOpen ||
    ["/resources", "/testimonials", "/about-dev", "/about", "/help", "/contact"].some((p) =>
      location.pathname.startsWith(p)
    );

  const NAV_ITEMS = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      isActive: isDashboardActive,
      onClick: handleDashboardClick,
    },
    {
      id: "timetable",
      label: "Timetable",
      icon: Clock,
      isActive: isTimetableActive,
      onClick: handleTimetableClick,
    },
    {
      id: "attendance",
      label: "Attendance",
      icon: Percent,
      isActive: isAttendanceActive,
      onClick: handleAttendanceClick,
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart2,
      isActive: isAnalyticsActive,
      onClick: handleAnalyticsClick,
    },
    {
      id: "rankings",
      label: "Rankings",
      icon: Trophy,
      isActive: isRankingsActive,
      onClick: handleRankingsClick,
    },
    {
      id: "more",
      label: "More",
      icon: Menu,
      isActive: isMoreActive,
      onClick: () => setIsMoreOpen((prev) => !prev),
    },
  ];

  return (
    <>
      {/* ── Fixed Bottom Navigation Bar (Mobile / Small Screen Only) ── */}
      <nav
        className="gf-mobile-bottom-nav"
        aria-label="Mobile Bottom Navigation"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 998,
          background: "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid #e2e8f0",
          boxShadow: "none",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          height: "calc(58px + env(safe-area-inset-bottom, 0px))",
          alignItems: "stretch",
          justifyContent: "space-around",
          boxSizing: "border-box",
          userSelect: "none",
          WebkitUserSelect: "none",
          touchAction: "manipulation",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "58px",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 4px",
            boxSizing: "border-box",
          }}
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.isActive;
            return (
              <motion.button
                key={item.id}
                type="button"
                whileTap={{ scale: 0.88 }}
                onClick={item.onClick}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  background: "transparent",
                  border: "none",
                  padding: "4px 1px",
                  cursor: "pointer",
                  color: active ? "#2563eb" : "#64748b",
                  position: "relative",
                  transition: "color 0.18s ease",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {/* Icon Container with subtle pill highlight for active state */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 38,
                    height: 26,
                    borderRadius: 14,
                    background: active ? "#eff6ff" : "transparent",
                    transition: "all 0.18s ease",
                  }}
                >
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.5 : 2}
                    color={active ? "#2563eb" : "#64748b"}
                  />
                </div>

                {/* Text Label */}
                <span
                  style={{
                    fontSize: "clamp(9px, 2.45vw, 10.5px)",
                    fontWeight: active ? 800 : 550,
                    lineHeight: 1.1,
                    letterSpacing: "-0.03em",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "100%",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {item.label}
                </span>

                {/* Active Indicator dot */}
                {active && (
                  <motion.div
                    layoutId="gf-bottom-nav-active-pip"
                    style={{
                      position: "absolute",
                      top: 4,
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: "#2563eb",
                    }}
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* ── "More" Bottom Sheet Drawer (Instagram / ModernMobileSubNav Architecture) ── */}
      {createPortal(
        <AnimatePresence>
          {isMoreOpen && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 10000,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
              }}
            >
              {/* Semi-transparent Blur Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
                onClick={() => setIsMoreOpen(false)}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(15, 23, 42, 0.52)",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                  zIndex: 10000,
                }}
              />

              {/* Bottom Sheet Modal Container */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                drag="y"
                dragControls={dragControls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.7 }}
                onDragEnd={(e, info) => {
                  if (info.offset.y > 80 || info.velocity.y > 350) {
                    setIsMoreOpen(false);
                  }
                }}
                style={{
                  position: "relative",
                  background: "#ffffff",
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  border: "1px solid #e2e8f0",
                  borderBottom: "none",
                  boxShadow: "none",
                  maxHeight: "86dvh",
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  zIndex: 10001,
                  boxSizing: "border-box",
                  overflow: "hidden",
                  overscrollBehavior: "contain",
                  WebkitOverscrollBehavior: "contain",
                }}
              >
                {/* Drag Handle & Sheet Header */}
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
                  {/* Top Drag Handle Bar */}
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
                        width: 42,
                        height: 5,
                        borderRadius: 99,
                        background: "#cbd5e1",
                      }}
                    />
                  </div>

                  {/* Header Title & Close Button */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "2px 18px 12px 18px",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 9,
                          background: "#eff6ff",
                          color: "#2563eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Layers size={17} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 850, color: "#0f172a" }}>
                          Navigation &amp; Services
                        </h3>
                        <p style={{ margin: 0, fontSize: 11.5, color: "#64748b", fontWeight: 600 }}>
                          Campus tools, portals &amp; settings
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsMoreOpen(false)}
                      aria-label="Close menu"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "#f1f5f9",
                        border: "none",
                        color: "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Scrollable Sheet Content */}
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
                    padding: "14px 16px calc(24px + env(safe-area-inset-bottom, 0px)) 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    boxSizing: "border-box",
                  }}
                >
                  {/* Student Account Summary Card (if session is active) */}
                  {hasActiveSession && currentRegNo && (
                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: 14,
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: "#2563eb",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: 14,
                            flexShrink: 0,
                          }}
                        >
                          <User size={18} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 800,
                                color: "#0f172a",
                                fontFamily: "'Space Mono', monospace",
                              }}
                            >
                              {currentRegNo}
                            </span>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                                fontSize: 10,
                                fontWeight: 700,
                                color: "#166534",
                                background: "#dcfce7",
                                padding: "1px 6px",
                                borderRadius: 4,
                              }}
                            >
                              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#16a34a" }} />
                              Active
                            </span>
                          </div>
                          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b", fontWeight: 550, truncate: true }}>
                            {studentData?.studentName || studentSession?.studentName || "Centurion University Student"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Primary Grid of Services & Tools */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {/* 1. Academic Resources */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreOpen(false);
                        navigate("/resources");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        borderRadius: 14,
                        border: location.pathname === "/resources" ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                        background: location.pathname === "/resources" ? "#eff6ff" : "#ffffff",
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: "#eff6ff",
                            color: "#2563eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <BookOpen size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 750, color: "#0f172a" }}>
                            Academic Resources
                          </div>
                          <div style={{ fontSize: 11.5, color: "#64748b", fontWeight: 500 }}>
                            Syllabi, Question Papers, Baskets &amp; Notes
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} color="#94a3b8" />
                    </button>

                    {/* 2. Student Reviews & Testimonials */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreOpen(false);
                        navigate("/testimonials");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        borderRadius: 14,
                        border: location.pathname === "/testimonials" ? "1.5px solid #059669" : "1px solid #e2e8f0",
                        background: location.pathname === "/testimonials" ? "#ecfdf5" : "#ffffff",
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: "#ecfdf5",
                            color: "#059669",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <MessageSquare size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 750, color: "#0f172a" }}>
                            Student Reviews
                          </div>
                          <div style={{ fontSize: 11.5, color: "#64748b", fontWeight: 500 }}>
                            Verified feedback &amp; batch ratings
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} color="#94a3b8" />
                    </button>

                    {/* 3. About Developer */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreOpen(false);
                        navigate("/about-dev");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        borderRadius: 14,
                        border: location.pathname === "/about-dev" ? "1.5px solid #7c3aed" : "1px solid #e2e8f0",
                        background: location.pathname === "/about-dev" ? "#f5f3ff" : "#ffffff",
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: "#f5f3ff",
                            color: "#7c3aed",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Code2 size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 750, color: "#0f172a" }}>
                            About Developer
                          </div>
                          <div style={{ fontSize: 11.5, color: "#64748b", fontWeight: 500 }}>
                            Architecture, engineering mission &amp; creator profile
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} color="#94a3b8" />
                    </button>

                    {/* 4. Feedback Modal Trigger */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreOpen(false);
                        window.dispatchEvent(
                          new CustomEvent("open-feedback-modal", { detail: { from: "bottom-nav-more" } })
                        );
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        borderRadius: 14,
                        border: "1px solid #e2e8f0",
                        background: "#ffffff",
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: "#fff7ed",
                            color: "#ea580c",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Star size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 750, color: "#0f172a" }}>
                            Share Feedback
                          </div>
                          <div style={{ fontSize: 11.5, color: "#64748b", fontWeight: 500 }}>
                            Help us improve GradeFlow for your university
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} color="#94a3b8" />
                    </button>

                    {/* 6. About & FAQ */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreOpen(false);
                        navigate("/about");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        borderRadius: 14,
                        border: location.pathname === "/about" ? "1.5px solid #0284c7" : "1px solid #e2e8f0",
                        background: location.pathname === "/about" ? "#f0f9ff" : "#ffffff",
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: "#f0f9ff",
                            color: "#0284c7",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Info size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 750, color: "#0f172a" }}>
                            About &amp; Documentation
                          </div>
                          <div style={{ fontSize: 11.5, color: "#64748b", fontWeight: 500 }}>
                            Official grading scales, predictions &amp; policy
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} color="#94a3b8" />
                    </button>
                  </div>

                  {/* ── Sign Out / Sign In Action Section ── */}
                  <div style={{ marginTop: 6, borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
                    {hasActiveSession ? (
                      showLogoutConfirm ? (
                        <div
                          style={{
                            padding: "14px",
                            borderRadius: 14,
                            background: "#fef2f2",
                            border: "1.5px solid #fecaca",
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                          }}
                        >
                          <div style={{ fontSize: 13.5, fontWeight: 750, color: "#991b1b" }}>
                            Are you sure you want to sign out?
                          </div>
                          <p style={{ margin: 0, fontSize: 12, color: "#7f1d1d", lineHeight: 1.4 }}>
                            Your device session will be securely cleared.
                          </p>
                          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                            <button
                              type="button"
                              onClick={() => setShowLogoutConfirm(false)}
                              style={{
                                flex: 1,
                                padding: "9px 12px",
                                borderRadius: 10,
                                background: "#ffffff",
                                border: "1px solid #cbd5e1",
                                color: "#334155",
                                fontSize: 12.5,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsMoreOpen(false);
                                leaveSession();
                              }}
                              disabled={isLoggingOut}
                              style={{
                                flex: 1,
                                padding: "9px 12px",
                                borderRadius: 10,
                                background: "#dc2626",
                                border: "none",
                                color: "#ffffff",
                                fontSize: 12.5,
                                fontWeight: 750,
                                cursor: isLoggingOut ? "not-allowed" : "pointer",
                              }}
                            >
                              {isLoggingOut ? "Signing out..." : "Yes, Sign Out"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowLogoutConfirm(true)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 14px",
                            borderRadius: 14,
                            border: "1.5px solid #fecaca",
                            background: "#fef2f2",
                            color: "#dc2626",
                            cursor: "pointer",
                            width: "100%",
                            textAlign: "left",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 9,
                                background: "#fee2e2",
                                color: "#dc2626",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <LogOut size={16} />
                            </div>
                            <div>
                              <div style={{ fontSize: 13.5, fontWeight: 750, color: "#991b1b" }}>
                                Sign Out of Account
                              </div>
                              <div style={{ fontSize: 11, color: "#b91c1c", fontWeight: 550 }}>
                                Terminate active session on this device
                              </div>
                            </div>
                          </div>
                          <ChevronRight size={16} color="#f87171" />
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMoreOpen(false);
                          openStudentAuthModal();
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 14px",
                          borderRadius: 14,
                          border: "1.5px solid #bfdbfe",
                          background: "#eff6ff",
                          color: "#2563eb",
                          cursor: "pointer",
                          width: "100%",
                          textAlign: "left",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 9,
                              background: "#2563eb",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <GraduationCap size={18} />
                          </div>
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 750, color: "#1e40af" }}>
                              Student Portal Login
                            </div>
                            <div style={{ fontSize: 11, color: "#3b82f6", fontWeight: 550 }}>
                              Sign in to view your CGPA &amp; semester records
                            </div>
                          </div>
                        </div>
                        <ChevronRight size={16} color="#60a5fa" />
                      </button>
                    )}
                  </div>
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
